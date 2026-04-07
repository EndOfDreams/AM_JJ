import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Trash2, AtSign, X } from 'lucide-react-native';
import {
    supabase,
    addComment,
    deleteComment,
    fetchComments,
    fetchGuests,
    fetchGuestGender,
    type Comment,
} from '@/lib/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────

function getGenderEmoji(gender?: string): string {
    switch (gender) {
        case 'F':  return '👩';
        case 'MA': return '🤵';
        case 'FA': return '👰';
        case 'H':
        default:   return '👨';
    }
}

function parseContent(content: string) {
    const parts = content.split(/(@[\w\-\s]+?)(?=\s|$|[,.])/g);
    return parts.map((part, i) =>
        part.startsWith('@')
            ? <Text key={i} style={styles.mention}>{part}</Text>
            : <Text key={i}>{part}</Text>
    );
}

function timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
}

// ── Types ──────────────────────────────────────────────────────────────────

type Props = {
    visible: boolean;
    onClose: () => void;
    photoId: string;
    currentUser: string;
    onCommentCountChange?: (count: number) => void;
    onCommentQueued?: (text: string) => void;
};

// ── Component ──────────────────────────────────────────────────────────────

export default function CommentSheet({
    visible,
    onClose,
    photoId,
    currentUser,
    onCommentCountChange,
    onCommentQueued,
}: Props) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const inputRef = useRef<TextInput>(null);

    const [comments, setComments] = useState<Comment[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [guests, setGuests] = useState<string[]>([]);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStart, setMentionStart] = useState(0);
    const [genderMap, setGenderMap] = useState<Record<string, string>>({});

    const snapPoints = useMemo(() => [SCREEN_HEIGHT * 0.92], []);

    // ── Open / close ────────────────────────────────────────────────────────

    useEffect(() => {
        if (visible) {
            sheetRef.current?.present();
            load();
            fetchGuests().then(setGuests);
        } else {
            sheetRef.current?.dismiss();
            setInput('');
            setMentionQuery(null);
        }
    }, [visible, photoId]);

    // ── Data ────────────────────────────────────────────────────────────────

    const load = async () => {
        if (photoId.startsWith('temp-')) { setLoading(false); return; }
        setLoading(true);
        const data = await fetchComments(photoId);
        setComments(data);
        onCommentCountChange?.(data.length);
        setLoading(false);
        // Fetch genres pour les auteurs pas encore en cache
        const unknown = [...new Set(data.map(c => c.created_by))].filter(name => !(name in genderMap));
        if (unknown.length > 0) {
            const entries = await Promise.all(unknown.map(async name => [name, await fetchGuestGender(name)] as const));
            setGenderMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        }
    };

    useEffect(() => {
        if (!visible) return;
        const channel = supabase
            .channel(`comments:${photoId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `photo_id=eq.${photoId}`,
            }, () => { load(); })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [visible, photoId]);

    // ── Input / mentions ────────────────────────────────────────────────────

    const handleInputChange = (text: string) => {
        setInput(text);
        const atIdx = text.lastIndexOf('@');
        if (atIdx !== -1 && (atIdx === 0 || text[atIdx - 1] === ' ')) {
            const query = text.slice(atIdx + 1);
            if (!query.includes('  ')) {
                setMentionQuery(query);
                setMentionStart(atIdx);
                return;
            }
        }
        setMentionQuery(null);
    };

    const filteredGuests = mentionQuery !== null
        ? guests
            .filter(g => g.toLowerCase().includes(mentionQuery!.toLowerCase()) && g !== currentUser)
            .slice(0, 4)
        : [];

    const insertMention = (name: string) => {
        const before = input.slice(0, mentionStart);
        setInput(`${before}@${name} `);
        setMentionQuery(null);
        inputRef.current?.focus();
    };

    // ── Send ────────────────────────────────────────────────────────────────

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        if (photoId.startsWith('temp-')) {
            const optimisticComment: Comment = {
                id: Date.now() as unknown as number,
                photo_id: photoId,
                created_by: currentUser,
                content: trimmed,
                created_at: new Date().toISOString(),
            };
            const updated = [...comments, optimisticComment];
            setComments(updated);
            onCommentCountChange?.(updated.length);
            onCommentQueued?.(trimmed);
            setInput('');
            setMentionQuery(null);
            return;
        }

        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const newComment = await addComment(photoId, currentUser, trimmed);
            if (newComment) {
                const updated = [...comments, newComment];
                setComments(updated);
                onCommentCountChange?.(updated.length);
            }
            // Notifier les personnes mentionnées (fire-and-forget)
            const mentioned = [...trimmed.matchAll(/@([\w\-]+(?: [\w\-]+)*)/g)].map(m => m[1]);
            if (mentioned.length) {
                const { sendMentionNotification } = await import('@/lib/notifications');
                sendMentionNotification(mentioned, currentUser, trimmed);
            }
            setInput('');
            setMentionQuery(null);
            setTimeout(() => inputRef.current?.focus(), 50);
        } catch {
            Alert.alert('Erreur', "Impossible d'envoyer le commentaire.");
        } finally {
            setSending(false);
        }
    };

    // ── Delete ──────────────────────────────────────────────────────────────

    const handleDelete = (comment: Comment) => {
        if (comment.created_by !== currentUser) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    await deleteComment(comment.id);
                    const updated = comments.filter(c => c.id !== comment.id);
                    setComments(updated);
                    onCommentCountChange?.(updated.length);
                },
            },
        ]);
    };

    // ── Render helpers ──────────────────────────────────────────────────────

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior="close"
            />
        ),
        []
    );

    const renderComment = useCallback(({ item }: { item: Comment }) => (
        <View style={styles.commentRow}>
            <LinearGradient
                colors={(['H', 'MA'].includes(genderMap[item.created_by]))
                    ? ['#BFDBFE', '#93C5FD']
                    : ['#F9A8D4', '#D8B4FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
            >
                <Text style={styles.avatarEmoji}>{getGenderEmoji(genderMap[item.created_by])}</Text>
            </LinearGradient>
            <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{item.created_by}</Text>
                <Text style={styles.commentText}>{parseContent(item.content)}</Text>
                <View style={styles.commentMeta}>
                    <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                    {item.created_by === currentUser && (
                        <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Trash2 size={12} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    ), [currentUser, comments, genderMap]);

    // ── JSX ─────────────────────────────────────────────────────────────────

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="none"
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            onDismiss={onClose}
            handleIndicatorStyle={styles.handleIndicator}
            handleStyle={styles.handleContainer}
            backgroundStyle={styles.sheetBackground}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Commentaires</Text>
                <TouchableOpacity
                    onPress={() => sheetRef.current?.dismiss()}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#EC4899" />
                </View>
            ) : (
                <BottomSheetFlatList
                    data={comments}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderComment}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>💬</Text>
                            <Text style={styles.empty}>Soyez le premier à commenter</Text>
                        </View>
                    }
                />
            )}

            {/* Bottom: mentions + input */}
            <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                {filteredGuests.length > 0 && (
                    <View style={styles.mentionList}>
                        {filteredGuests.map((name, idx) => (
                            <TouchableOpacity
                                key={name}
                                style={[
                                    styles.mentionItem,
                                    idx < filteredGuests.length - 1 && styles.mentionItemBorder,
                                ]}
                                onPress={() => insertMention(name)}
                            >
                                <View style={styles.mentionAvatar}>
                                    <AtSign size={12} color="#EC4899" />
                                </View>
                                <Text style={styles.mentionName}>{name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.inputRow}>
                    <BottomSheetTextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Ajouter un commentaire…"
                        placeholderTextColor="#9CA3AF"
                        value={input}
                        onChangeText={handleInputChange}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        activeOpacity={!input.trim() || sending ? 1 : 0.7}
                        style={[
                            styles.sendBtn,
                            (!input.trim() || sending) && styles.sendBtnDisabled,
                        ]}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="white" />
                            : <Send size={16} color="white" />
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheetModal>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handleContainer: {
        paddingTop: 10,
        paddingBottom: 6,
    },
    handleIndicator: {
        backgroundColor: '#E5E7EB',
        width: 40,
        height: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 8,
    },
    emptyIcon: { fontSize: 36 },
    empty: { color: '#9CA3AF', fontSize: 14 },
    commentRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarEmoji: {
        fontSize: 18,
    },
    commentContent: {
        flex: 1,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    commentTime: { fontSize: 11, color: '#9CA3AF' },
    mention: { color: '#3B82F6', fontWeight: '600' },
    bottomSection: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    mentionList: {
        backgroundColor: '#FFFFFF',
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    mentionItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F3F4F6',
    },
    mentionAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FDF2F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mentionName: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 14,
        color: '#1F2937',
        maxHeight: 100,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EC4899',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Platform.OS === 'ios' ? 2 : 0,
    },
    sendBtnDisabled: { backgroundColor: '#E5E7EB' },
});
