import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, UserPlus } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PinInput,
} from '@/Global/components/atoms'
import { CreateProfileFormData, CreateProfileSchema } from '@/Profile/schemas'
import { useCreateProfile } from '@/Profile/queries'

interface CreateProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProfileModal({ isOpen, onClose }: CreateProfileModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const createProfile = useCreateProfile()

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: {
      name: '',
      role: 'CHILD',
      pin: '',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('image', file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: CreateProfileFormData) => {
    try {
      await createProfile.mutateAsync({
        name: data.name,
        role: data.role,
        pin: data.pin || undefined,
        image: data.image,
      })

      toast.success('Profile created', {
        description: `${data.name} has been added to your family`,
      })

      form.reset()
      setImagePreview(null)
      onClose()
    } catch (error) {
      toast.error('Failed to create profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Profile
          </DialogTitle>
          <DialogDescription>
            Add a new profile to your family. You can create profiles for parents or children.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Avatar className="h-24 w-24">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {form.watch('name') ? form.watch('name').charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="profile-image"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label htmlFor="profile-image">
                  <Button variant="outline" className="cursor-pointer" type="button" asChild>
                    <div>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </div>
                  </Button>
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter profile name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is how the profile will be displayed in Cadence.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="CHILD">Child</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Parents have full access to manage family settings and modules.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile PIN (Optional)</FormLabel>
                  <FormControl>
                    <PinInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      length={6}
                      description="Set a 6-digit PIN to protect this profile (optional)"
                    />
                  </FormControl>
                  <FormDescription>
                    If set, this PIN will be required to access the profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  form.reset()
                  setImagePreview(null)
                  onClose()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProfile.isPending}>
                {createProfile.isPending ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
