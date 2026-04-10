import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Shadow, Typography } from '@/constants/Theme';

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.primary,
        tabBarInactiveTintColor: Theme.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Fonts.interMd,
          fontSize: 11,
        },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.surface,
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          ...Shadow.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.available', { defaultValue: 'Buyurtmalar' }),
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: t('tabs.myOrders', { defaultValue: 'Mening' }),
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile', { defaultValue: 'Profil' }),
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
