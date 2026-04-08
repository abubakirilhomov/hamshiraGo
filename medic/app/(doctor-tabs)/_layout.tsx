import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Theme } from '@/constants/Theme';

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function DoctorTabLayout() {
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
          title: 'Konsultatsiyalar',
          tabBarIcon: ({ color }) => <TabIcon name="stethoscope" color={color} />,
          headerTitle: 'Konsultatsiyalar',
        }}
      />
      <Tabs.Screen
        name="my-patients"
        options={{
          title: 'Bemorlar',
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
          headerTitle: 'Bemorlar',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
          headerTitle: 'Profil',
        }}
      />
    </Tabs>
  );
}
