import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { UpdateProfileRequest } from '@/Profile/types'
import { useUpdateProfile, useActiveProfile } from '@/Profile/queries/profile'
import {
  ProfileDetailsSection,
  ProfilePinSection,
} from '@/Profile/components/organisms/manage/sections'

export const Route = createFileRoute('/_authenticated/profile/settings')({
  component: ProfileManagePage,
})
