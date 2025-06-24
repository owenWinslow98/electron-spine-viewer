import React, { useCallback} from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { z } from 'zod'
import { UseFormReturn } from 'react-hook-form'


const FormSchema = z.object({
  skins: z.string({}),
  animations: z.string({}),
  skeletonVersion: z.string({}),
})

interface FormProps {
  className?: string
  onSkinChange?: (value: string) => void
  onAnimationChange?: (value: string) => void
  form: UseFormReturn<z.infer<typeof FormSchema>>
  skinsList: string[]
  animationList: string[]
}

export const SkelForm: React.FC<FormProps> = ({ 
  className, 
  onSkinChange, 
  onAnimationChange,
  form,
  skinsList,
  animationList
}) => {

  const handleSkinChange = useCallback((value: string) => {
    form.setValue('skins', value)
    onSkinChange?.(value)
  }, [form, onSkinChange])

  const handleAnimationChange = useCallback((value: string) => {
    form.setValue('animations', value)
    onAnimationChange?.(value)
  }, [form, onAnimationChange])

  return (
    <div className={`w-64 h-full bg-background ${className || ''}`}>
      <Form {...form}>
        <form className="w-3/4 space-y-6 flex flex-col items-center justify-center h-full w-full">
          <FormField
            control={form.control}
            name="skeletonVersion"
            render={({ field }) => (
              <FormItem className="w-3/4">
                <FormLabel>Skeleton Version</FormLabel>
                <Input {...field} disabled />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skins"
            render={({ field }) => (
              <FormItem className="w-3/4">
                <FormLabel>Skins</FormLabel>
                <Select onValueChange={handleSkinChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {skinsList.map(skin => (
                      <SelectItem value={skin} key={skin}>{skin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="animations"
            render={({ field }) => (
              <FormItem className="w-3/4">
                <FormLabel>Animations</FormLabel>
                <Select onValueChange={handleAnimationChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {animationList.map(animation => (
                      <SelectItem value={animation} key={animation}>{animation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}