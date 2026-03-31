'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = es,
  weekStartsOn = 0,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      weekStartsOn={weekStartsOn}
      className={cn('p-3', className)}
      classNames={{
        // v9 classNames
        root: 'w-full relative',
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center h-7 mb-4',
        caption_label: 'text-sm font-semibold uppercase',
        nav: 'absolute top-3 left-0 right-0 flex justify-between px-2 z-10',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 font-normal text-[0.8rem] text-center pb-1 uppercase',
        week: 'flex w-full mt-1',
        day: 'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground',
        ),
        // Range styles
        range_start: 'rounded-l-full bg-primary/15 [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-full [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        range_end: 'rounded-r-full bg-primary/15 [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-full [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        range_middle: 'bg-primary/15 [&>button]:bg-transparent [&>button]:text-foreground [&>button]:rounded-none [&>button]:hover:bg-primary/25',
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-full [&>button]:hover:bg-primary',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold',
        outside: 'text-muted-foreground opacity-40 [&>button]:text-muted-foreground',
        disabled: '[&>button]:text-muted-foreground [&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:pointer-events-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }: { orientation?: 'left' | 'right' }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      } as any}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
