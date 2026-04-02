module.exports = {
    expo: {
        name: "WedSnap",
        slug: "AM_jj",
        owner: "endofdreams32",
        version: "1.0.4",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "amjj",
        userInterfaceStyle: "light", // STORE_COMPLIANCE: Explicitly set to light until dark mode is fully implemented
        newArchEnabled: true,
        ios: {
            supportsTablet: false,  // STORE_COMPLIANCE: App is not optimized for iPad
            bundleIdentifier: "com.camilleperes.amjj",
            buildNumber: "1",
            infoPlist: {
                NSCameraUsageDescription: "Permettre à $(PRODUCT_NAME) d'accéder à votre caméra pour prendre des photos et vidéos de votre événement.",
                NSPhotoLibraryUsageDescription: "Permettre à $(PRODUCT_NAME) d'accéder à vos photos pour les partager avec les autres invités.",
                NSPhotoLibraryAddUsageDescription: "Permettre à $(PRODUCT_NAME) de sauvegarder les photos et vidéos dans votre galerie.",
                // STORE_COMPLIANCE: Required for video recording with audio
                NSMicrophoneUsageDescription: "Permettre à $(PRODUCT_NAME) d'accéder à votre microphone pour enregistrer des vidéos avec son.",
                // STORE_COMPLIANCE: Declare encryption usage for App Store
                ITSAppUsesNonExemptEncryption: false
            },
            privacyManifests: {
                // STORE_COMPLIANCE: Declare no tracking
                NSPrivacyTracking: false,
                NSPrivacyTrackingDomains: [],
                // STORE_COMPLIANCE: Declare collected data types
                NSPrivacyCollectedDataTypes: [
                    {
                        NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhotosorVideos",
                        NSPrivacyCollectedDataTypeLinked: false,
                        NSPrivacyCollectedDataTypeTracking: false,
                        NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
                    },
                    {
                        NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
                        NSPrivacyCollectedDataTypeLinked: true,
                        NSPrivacyCollectedDataTypeTracking: false,
                        NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
                    },
                    {
                        NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
                        NSPrivacyCollectedDataTypeLinked: true,
                        NSPrivacyCollectedDataTypeTracking: false,
                        NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
                    }
                ],
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
                    cameraPermission: "Permettre à $(PRODUCT_NAME) d'accéder à votre caméra pour prendre des photos et vidéos de votre événement.",
                    microphonePermission: "Permettre à $(PRODUCT_NAME) d'accéder à votre microphone pour enregistrer des vidéos avec son."
                }
            ],
            [
                "expo-media-library",
                {
                    photosPermission: "Permettre à $(PRODUCT_NAME) d'accéder à vos photos pour les partager avec les autres invités.",
                    savePhotosPermission: "Permettre à $(PRODUCT_NAME) de sauvegarder les photos et vidéos dans votre galerie.",
                    isAccessMediaLocationEnabled: true
                }
            ],
            [
                "expo-notifications",
                {
                    color: "#EC4899"
                }
            ]
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            // STORE_COMPLIANCE: Privacy Policy hosted on GitHub Pages
            privacyPolicyUrl: "https://endofdreams.github.io/AM_JJ/privacy-policy.html",
            // EAS configuration for push notifications
            eas: {
                projectId: "13483632-e9cc-480c-8163-2479de2662a0"
            }
        }
    }
};
