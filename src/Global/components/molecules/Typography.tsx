import { cn } from '@/Global/lib'

interface Props {
  className?: string
  children: React.ReactNode
  id?: string
}

const H1: React.FC<Props> = ({ className, children, id }) => (
  <h1 id={id} className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}>
    {children}
  </h1>
)

const H2: React.FC<Props> = ({ className, children, id }) => (
  <h2 id={id} className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)}>
    {children}
  </h2>
)

const H3: React.FC<Props> = ({ className, children, id }) => (
  <h3 id={id} className={cn('scroll-m-20 text-lg font-medium tracking-tight', className)}>
    {children}
  </h3>
)

const H4: React.FC<Props> = ({ className, children, id }) => (
  <h4 id={id} className={cn('scroll-m-20 text-base font-medium tracking-tight', className)}>
    {children}
  </h4>
)

const H5: React.FC<Props> = ({ className, children, id }) => (
  <h5 id={id} className={cn('scroll-m-20 text-sm font-medium tracking-tight', className)}>
    {children}
  </h5>
)

const H6: React.FC<Props> = ({ className, children, id }) => (
  <h6 id={id} className={cn('scroll-m-20 text-sm font-normal tracking-tight', className)}>
    {children}
  </h6>
)

const P: React.FC<Props> = ({ className, children, id }) => (
  <p id={id} className={cn('text-sm leading-7', className)}>
    {children}
  </p>
)

const Lead: React.FC<Props> = ({ className, children, id }) => (
  <p id={id} className={cn('text-base text-muted-foreground', className)}>
    {children}
  </p>
)

const Large: React.FC<Props> = ({ className, children, id }) => (
  <div id={id} className={cn('text-lg font-medium', className)}>
    {children}
  </div>
)

const Small: React.FC<Props> = ({ className, children, id }) => (
  <small id={id} className={cn('text-xs font-normal leading-none', className)}>
    {children}
  </small>
)

const Muted: React.FC<Props> = ({ className, children, id }) => (
  <p id={id} className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
)

export { H1, H2, H3, H4, H5, H6, P, Lead, Large, Small, Muted }
