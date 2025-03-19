import { createFileRoute } from '@tanstack/react-router'
import { Clock, Bell, Palette } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
} from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { H2, Section } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'

export const Route = createFileRoute('/_authenticated/profile/preferences')({
  component: SettingsPage,
})
