
import { Redirect } from 'expo-router';
import React from 'react';

// Redirect /feed to the main Swiper with screen=feed param
export default function FeedRoute() {
  return <Redirect href="/?screen=feed" />;
}