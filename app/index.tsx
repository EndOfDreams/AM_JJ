
import BottomNav from '@/components/navigation/BottomNav';
import CameraScreen from '@/components/screens/CameraScreen';
import FeedScreen from '@/components/screens/FeedScreen';
import PlanningScreen from '@/components/screens/PlanningScreen';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';

export default function Home() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const currentPage = useRef<'Feed' | 'Camera' | 'Planning'>('Camera');
  const [activePage, setActivePage] = useState<'Feed' | 'Camera' | 'Planning'>('Camera');
  const [unseenPhotosCount, setUnseenPhotosCount] = useState(0);
  const fadeInAnim = useRef(new Animated.Value(1)).current;
  const [fadeInDone, setFadeInDone] = useState(false);

  // Fade in from white on mount (bridge from video transition)
  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setFadeInDone(true));
  }, []);

  // A1: Listen for unseen photo count from FeedScreen
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('feed.unseenCount', (count: number) => {
      setUnseenPhotosCount(count);
    });
    return () => sub.remove();
  }, []);

  // 0 = Feed, 1 = Camera, 2 = Planning

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);

    let newPage: 'Feed' | 'Camera' | 'Planning' = 'Camera';
    if (pageIndex === 0) newPage = 'Feed';
    if (pageIndex === 1) newPage = 'Camera';
    if (pageIndex === 2) newPage = 'Planning';

    if (activePage !== newPage) {
      setActivePage(newPage);
      currentPage.current = newPage;
    }
  };

  const navigateTo = (page: string) => {
    if (page === 'Feed') {
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    } else if (page === 'Camera') {
      scrollViewRef.current?.scrollTo({ x: width, animated: false });
    } else if (page === 'Planning') {
      scrollViewRef.current?.scrollTo({ x: width * 2, animated: false });
    }
  };

  // Handle initial param to open feed directly if requested
  useEffect(() => {
    if (params.screen === 'feed') {
      // Small delay to allow layout
      setTimeout(() => navigateTo('Feed'), 100);
    }
  }, [params.screen]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ width: width * 3 }}
        contentOffset={{ x: width, y: 0 }} // Start at Camera (Index 1)
      >
        {/* Screen 1: Feed (Index 0) - Left */}
        <View style={[styles.screen, { width }]}>
          <FeedScreen isFocused={activePage === 'Feed'} />
        </View>

        {/* Screen 2: Camera (Index 1) - Center */}
        <View style={[styles.screen, { width }]}>
          <CameraScreen isFocused={activePage === 'Camera'} />
        </View>

        {/* Screen 3: Planning (Index 2) - Right */}
        <View style={[styles.screen, { width }]}>
          <PlanningScreen />
        </View>
      </ScrollView>

      {/* Navigation Overlay */}
      <View style={styles.navOverlay}>
        <BottomNav
          currentPage={activePage}
          onNavigate={navigateTo}
          newPhotosCount={unseenPhotosCount}
        />
      </View>

      {/* Fade in from white after video transition */}
      {!fadeInDone && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ffffff', opacity: fadeInAnim, zIndex: 9999 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    height: '100%',
    overflow: 'hidden',
  },
  navOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  }
});