import { z } from 'zod';

// Schema de validation pour la connexion
// Note: On garde 'name' pour l'UX, mais on convertira en email côté backend
export const loginSchema = z.object({
    name: z.string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(100, 'Le nom est trop long')
        .trim(),
    password: z.string()
        .min(3, 'Le code d\'accès doit contenir au moins 3 caractères')
        .max(100, 'Le mot de passe est trop long'),
});

// Schema pour les photos
export const photoSchema = z.object({
    image_url: z.string().url('URL invalide'),
    media_type: z.enum(['photo', 'video']),
    created_by: z.string().min(1, 'Créateur requis'),
    caption: z.string().max(200).optional(),
});

// Schema pour les likes
export const likeSchema = z.object({
    photoId: z.string().uuid('ID photo invalide'),
    userEmail: z.string().min(1, 'Email requis'),
});

// Types TypeScript générés
export type LoginInput = z.infer<typeof loginSchema>;
export type PhotoInput = z.infer<typeof photoSchema>;
export type LikeInput = z.infer<typeof likeSchema>;
