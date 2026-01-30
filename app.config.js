module.exports = {
    expo: {
        name: "AM_jj",
        slug: "AM_jj",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "amjj",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.camilleperes.amjj",
            buildNumber: "1",
            infoPlist: {
                NSCameraUsageDescription: "Permettre à $(PRODUCT_NAME) d'accéder à votre caméra pour prendre des photos et vidéos du mariage.",
                NSPhotoLibraryUsageDescription: "Permettre à $(PRODUCT_NAME) d'accéder à vos photos pour les partager avec les invités du mariage.",
                NSPhotoLibraryAddUsageDescription: "Permettre à $(PRODUCT_NAME) de sauvegarder les photos et vidéos du mariage dans votre galerie."
            },
            privacyManifests: {
                NSPrivacyAccessedAPITypes: [
                    {
                        NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
                        NSPrivacyAccessedAPITypeReasons: ["C617.1"]
                    },
                    {
                        NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
                        NSPrivacyAccessedAPITypeReasons: ["CA92.1"]
                    }
                ]
            }
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: "com.camilleperes.amjj",
            versionCode: 1,
            permissions: [
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "READ_MEDIA_IMAGES",
                "READ_MEDIA_VIDEO"
            ]
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000"
                    }
                }
            ],
            [
                "expo-camera",
                {
                    cameraPermission: "Permettre à $(PRODUCT_NAME) d'accéder à votre caméra pour prendre des photos et vidéos du mariage.",
                    microphonePermission: "Permettre à $(PRODUCT_NAME) d'accéder à votre microphone pour enregistrer des vidéos avec son."
                }
            ],
            [
                "expo-media-library",
                {
                    photosPermission: "Permettre à $(PRODUCT_NAME) d'accéder à vos photos pour les partager avec les invités du mariage.",
                    savePhotosPermission: "Permettre à $(PRODUCT_NAME) de sauvegarder les photos et vidéos du mariage dans votre galerie.",
                    isAccessMediaLocationEnabled: true
                }
            ]
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
        }
    }
};
