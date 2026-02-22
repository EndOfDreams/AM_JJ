// @ts-ignore
import { Link } from 'expo-router';
import { CalendarHeart, Camera, Images } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingBar } from '../ui/LoadingBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BottomNavProps {
  currentPage: string;
  onNavigate?: (page: string) => void;
  newPhotosCount?: number;
}

const NAV_PADDING_H = 24;
const CONTENT_MAX_WIDTH = 448;
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH - NAV_PADDING_H * 2, CONTENT_MAX_WIDTH);
const INDICATOR_WIDTH = 32;

// Tab center positions with space-around layout: 1/6, 3/6, 5/6
const TAB_CENTERS = [
  CONTENT_WIDTH / 6,
  CONTENT_WIDTH / 2,
  (CONTENT_WIDTH * 5) / 6,
];

interface NavItem {
  name: string;
  icon: any;
  href: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Feed', icon: Images, href: '/feed' },
  { name: 'Camera', icon: Camera, href: '/', isCenter: true },
  { name: 'Planning', icon: CalendarHeart, href: '/planning' }
];

const pageToIndex = (page: string) => {
  if (page === 'Feed') return 0;
  if (page === 'Camera') return 1;
  return 2;
};

export default function BottomNav({ currentPage, onNavigate, newPhotosCount = 0 }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(pageToIndex(currentPage))).current;
  const badgePulse = useRef(new Animated.Value(1)).current;
  const iconScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // C2: Animate sliding indicator on page change
  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: pageToIndex(currentPage),
      tension: 68,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [currentPage]);

  // A1: Badge pulse animation
  useEffect(() => {
    if (newPhotosCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(badgePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      badgePulse.setValue(1);
    }
  }, [newPhotosCount > 0]);

  // C2: Sliding indicator translateX
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: TAB_CENTERS.map(c => c - INDICATOR_WIDTH / 2),
  });

  // C2: Bounce animation on tab press
  const handlePress = (item: NavItem, index: number) => {
    Animated.sequence([
      Animated.timing(iconScales[index], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(iconScales[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    if (onNavigate) {
      if (item.href === '/') onNavigate('Camera');
      if (item.href === '/feed') onNavigate('Feed');
      if (item.href === '/planning') onNavigate('Planning');
    }
  };

  return (
    <View style={[styles.container, { bottom: 0 }]}>
      {/* Loading Bar - Only on Feed page */}
      {currentPage === 'Feed' && (
        <View style={styles.loadingBarContainer}>
          <LoadingBar height={3} />
        </View>
      )}
      <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navContent}>
          {navItems.map((item, index) => {
            const isActive =
              (currentPage === 'Camera' && item.href === '/') ||
              (currentPage === 'Feed' && item.href === '/feed') ||
              (currentPage === 'Planning' && item.href === '/planning');

            const Icon = item.icon;

            const content = (
              <TouchableOpacity
                style={styles.navItemContainer}
                activeOpacity={0.7}
                onPress={onNavigate ? () => handlePress(item, index) : undefined}
              >
                {/* Wrapper for center item static scale */}
                <View style={item.isCenter ? styles.navItemCenter : undefined}>
                  {/* C2: Animated bounce wrapper */}
                  <Animated.View style={[
                    styles.navItem,
                    { transform: [{ scale: iconScales[index] }] }
                  ]}>
                    {/* Icon container */}
                    <View style={[
                      styles.iconContainer,
                      isActive && styles.iconContainerActive
                    ]}>
                      <Icon
                        color={isActive ? '#DB2777' : '#9CA3AF'}
                        size={24}
                      />

                      {/* A1: Badge for Feed */}
                      {item.name === 'Feed' && newPhotosCount > 0 && (
                        <Animated.View style={[
                          styles.badge,
                          { transform: [{ scale: badgePulse }] }
                        ]}>
                          <Text style={styles.badgeText}>
                            {newPhotosCount > 99 ? '99+' : newPhotosCount}
                          </Text>
                        </Animated.View>
                      )}
                    </View>

                    {/* Label */}
                    <Text style={[
                      styles.navLabel,
                      isActive && styles.navLabelActive
                    ]}>
                      {item.name}
                    </Text>
                  </Animated.View>
                </View>
              </TouchableOpacity>
            );

            // Always use local navigation when onNavigate is provided
            if (onNavigate) {
              return <React.Fragment key={item.name}>{content}</React.Fragment>;
            }

            return (
              <Link key={item.name} href={item.href as any} asChild>
                {content}
              </Link>
            );
          })}

          {/* C2: Sliding Indicator */}
          <Animated.View
            style={[
              styles.slidingIndicator,
              { transform: [{ translateX: indicatorTranslateX }] }
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  navBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 207, 232, 0.5)',
    paddingHorizontal: NAV_PADDING_H,
    paddingVertical: 8,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  navItemContainer: {
    position: 'relative',
  },
  navItem: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  navItemCenter: {
    transform: [{ scale: 1.1 }],
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: '#FBCFE8',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  navLabelActive: {
    color: '#DB2777',
  },
  slidingIndicator: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#EC4899',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#F43F5E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
