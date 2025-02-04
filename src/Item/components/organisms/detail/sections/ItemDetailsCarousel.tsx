import { useEffect, useState } from 'react'
import { X, Upload } from 'lucide-react'
import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Input,
  PlaceholderImage,
} from '@/Global/components/atoms'
import { cn } from '@/Global/lib/utils'
import { Item } from '@/Item/types'

interface ItemDetailsCarouselProps {
  item: Item
  isEditing: boolean
  onImagesChange: (images: File[], imagesToDelete: string[]) => void
}

export function ItemDetailsCarousel({ item, isEditing, onImagesChange }: ItemDetailsCarouselProps) {
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImagesToUpload((prev) => [...prev, ...files])

      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
      onImagesChange([...imagesToUpload, ...files], imagesToDelete)
    }
  }

  const handleImageDelete = (imageUrl: string) => {
    setImagesToDelete((prev) => {
      const updated = prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
      onImagesChange(imagesToUpload, updated)
      return updated
    })
  }

  const handlePreviewDelete = (url: string, index: number) => {
    URL.revokeObjectURL(url)
    setPreviewUrls((prev) => prev.filter((u) => u !== url))
    setImagesToUpload((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      onImagesChange(updated, imagesToDelete)
      return updated
    })
  }

  return (
    <div className="w-64 relative">
      <Carousel className="w-full relative">
        <CarouselContent>
          {item.images.length === 0 && previewUrls.length === 0 ? (
            <CarouselItem>
              <div className="p-1">
                <div className="overflow-hidden rounded-lg border flex items-center justify-center">
                  <PlaceholderImage />
                </div>
              </div>
            </CarouselItem>
          ) : (
            <>
              {item.images
                .filter((image) => !imagesToDelete.includes(image.url))
                .map((image, index) => (
                  <CarouselItem key={image.id}>
                    <div className="p-1 relative">
                      <div
                        className={cn(
                          'overflow-hidden rounded-lg border flex items-center justify-center',
                          imagesToDelete.includes(image.url) && 'border-2 border-destructive/50',
                        )}
                      >
                        <img
                          src={image.url}
                          alt={`${item.name} - ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleImageDelete(image.url)}
                          className={cn(
                            'absolute top-2 right-2 p-1 rounded-full text-white',
                            imagesToDelete.includes(image.url)
                              ? 'bg-destructive/70 hover:bg-destructive'
                              : 'bg-destructive/90 hover:bg-destructive',
                          )}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CarouselItem>
                ))}

              {previewUrls.map((url, index) => (
                <CarouselItem key={`preview-${index}`}>
                  <div className="p-1 relative">
                    <div className="overflow-hidden rounded-lg border flex items-center justify-center">
                      <img src={url} alt={`New upload preview ${index + 1}`} className="w-full" />
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handlePreviewDelete(url, index)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-destructive/90 text-white hover:bg-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </>
          )}
        </CarouselContent>
        {(item.images.length > 0 || previewUrls.length > 0) && (
          <>
            <CarouselPrevious className="absolute left-[-3rem] top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-[-3rem] top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>

      {isEditing && (
        <div className="mt-4">
          <Input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            id="file-upload"
          />
          <Button variant="outline" className="w-full" asChild>
            <label htmlFor="file-upload" className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              {item.images.length === 0 && previewUrls.length === 0
                ? 'Upload Photo'
                : 'Upload More Photos'}
            </label>
          </Button>
        </div>
      )}
    </div>
  )
}
