import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';

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
        tabBarInactiveTintColor: Theme.textSecondary,
        headerStyle: { backgroundColor: Theme.surface },
        headerTitleStyle: { color: Theme.text, fontWeight: '700' },
        tabBarStyle: { borderTopColor: Theme.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.available'),
          tabBarIcon: ({ color }) => <TabIcon name="list-alt" color={color} />,
          headerTitle: t('orders.available'),
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: t('tabs.myOrders'),
          tabBarIcon: ({ color }) => <TabIcon name="briefcase" color={color} />,
          headerTitle: t('orders.my'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
          headerTitle: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
