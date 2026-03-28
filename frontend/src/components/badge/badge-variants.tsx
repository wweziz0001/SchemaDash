import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-primary/15 bg-primary/10 text-primary hover:bg-primary/15',
                secondary:
                    'border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15',
                outline: 'border-border bg-background text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);
