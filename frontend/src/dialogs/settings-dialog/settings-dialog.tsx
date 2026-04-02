import React, { useEffect, useMemo, useState } from 'react';
import {
    CreditCard,
    Globe,
    KeyRound,
    LayoutGrid,
    LogOut,
    Mail,
    Palette,
    Shield,
    UserRound,
    X,
} from 'lucide-react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { Separator } from '@/components/separator/separator';
import { useAuth } from '@/hooks/use-auth';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useStorage } from '@/hooks/use-storage';
import { languages } from '@/i18n/i18n';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type SettingsSectionId =
    | 'profile'
    | 'account'
    | 'api-keys'
    | 'canvas'
    | 'appearance'
    | 'subscription';

const sections = [
    {
        group: 'General',
        items: [
            { id: 'profile' as const, icon: UserRound, label: 'Profile' },
            { id: 'account' as const, icon: UserRound, label: 'Account' },
            { id: 'api-keys' as const, icon: KeyRound, label: 'API Keys' },
            { id: 'canvas' as const, icon: LayoutGrid, label: 'Canva' },
            { id: 'appearance' as const, icon: Palette, label: 'Appearance' },
        ],
    },
    {
        group: 'Billing',
        items: [
            {
                id: 'subscription' as const,
                icon: CreditCard,
                label: 'Subscription',
            },
        ],
    },
];

const navItemClasses =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] transition-colors';
const panelCardClasses = 'rounded-[18px] border-border/70 bg-card shadow-none';
const subtleTextClasses = 'text-[15px] text-muted-foreground';

const SettingSwitch = ({
    checked,
    onClick,
}: {
    checked: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        aria-pressed={checked}
        className={cn(
            'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
            checked ? 'bg-rose-500' : 'bg-stone-300 dark:bg-stone-700'
        )}
        onClick={onClick}
    >
        <span
            className={cn(
                'inline-block size-5 rounded-full bg-white shadow-sm transition-transform dark:bg-stone-100',
                checked ? 'translate-x-6' : 'translate-x-1'
            )}
        />
        <span className="sr-only">Toggle setting</span>
    </button>
);

const DetailRow = ({
    icon: Icon,
    title,
    value,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <div className="text-[15px] font-medium text-foreground">
                    {title}
                </div>
                <div className="truncate text-[15px] text-muted-foreground">
                    {value}
                </div>
            </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
    </div>
);

const AccountInfoField = ({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
}) => (
    <div className="flex items-center gap-4 rounded-2xl bg-muted/60 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground">
            <Icon className="size-4" />
        </div>
        <div className="min-w-0">
            <div className="text-[14px] text-muted-foreground">{label}</div>
            <div className="truncate pt-0.5 text-[15px] font-semibold text-foreground">
                {value}
            </div>
        </div>
    </div>
);

export interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const auth = useAuth();
    const localConfig = useLocalConfig();
    const { listCollections, listProjects, listProjectDiagrams } = useStorage();
    const translation = useTranslation();
    const i18n = translation.i18n ?? {
        changeLanguage: async () => undefined,
        languages: ['en'],
    };
    const [selectedSection, setSelectedSection] =
        useState<SettingsSectionId>('profile');
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [workspaceSnapshot, setWorkspaceSnapshot] = useState({
        collectionCount: 0,
        projectCount: 0,
        diagramCount: 0,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedSection('profile');
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const loadWorkspaceSnapshot = async () => {
            try {
                const [collections, projects] = await Promise.all([
                    listCollections(),
                    listProjects(),
                ]);
                const activeProjects = projects.filter(
                    (project) => project.status !== 'deleted'
                );
                const diagramsByProject = await Promise.all(
                    activeProjects.map((project) =>
                        listProjectDiagrams(project.id).catch(() => [])
                    )
                );

                if (cancelled) {
                    return;
                }

                setWorkspaceSnapshot({
                    collectionCount: collections.length,
                    projectCount: activeProjects.length,
                    diagramCount: diagramsByProject.reduce(
                        (count, diagrams) => count + diagrams.length,
                        0
                    ),
                });
            } catch {
                if (!cancelled) {
                    setWorkspaceSnapshot({
                        collectionCount: 0,
                        projectCount: 0,
                        diagramCount: 0,
                    });
                }
            }
        };

        void loadWorkspaceSnapshot();

        return () => {
            cancelled = true;
        };
    }, [listCollections, listProjectDiagrams, listProjects, open]);

    const displayName =
        auth.user?.displayName?.trim() ||
        auth.user?.email?.trim() ||
        'Local SchemaDash user';
    const email = auth.user?.email?.trim() || 'Not available';
    const currentLanguage =
        i18n.languages.find((code) =>
            languages.some((language) => language.code === code)
        ) ?? languages[0]?.code;

    const activeSection = useMemo(() => {
        return (
            sections
                .flatMap((section) => section.items)
                .find((item) => item.id === selectedSection) ??
            sections[0].items[0]
        );
    }, [selectedSection]);

    const ActiveIcon = activeSection.icon;

    const renderProfile = () => (
        <div className="space-y-4">
            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Account Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={UserRound}
                        title="Display name"
                        value={displayName}
                    />
                    <div className="shrink-0 space-y-2 text-right">
                        <Badge className="rounded-xl bg-muted px-3 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted">
                            Team Plan (Basic) (Trial)
                        </Badge>
                        <div className="text-[14px] font-medium text-rose-500">
                            Check Plans
                        </div>
                    </div>
                </CardContent>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={Mail}
                        title="Email address"
                        value={email}
                    />
                    <DetailRow
                        icon={Shield}
                        title="Role"
                        value={auth.user?.role ?? 'local'}
                    />
                    <DetailRow icon={Shield} title="" value="" />
                </CardContent>
            </Card>

            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Auto-Save Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={CreditCard}
                        title="Auto-Save"
                        value="Automatically save your changes"
                    />
                    <SettingSwitch
                        checked={autoSaveEnabled}
                        onClick={() =>
                            setAutoSaveEnabled((current) => !current)
                        }
                    />
                </CardContent>
            </Card>

            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Language
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                        <div className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground">
                            <Globe className="size-4" />
                        </div>
                        <Select
                            onValueChange={(value) => {
                                void i18n.changeLanguage(value);
                            }}
                            value={currentLanguage}
                        >
                            <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background text-[15px] text-foreground shadow-none">
                                <SelectValue placeholder="Choose language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((language) => (
                                    <SelectItem
                                        key={language.code}
                                        value={language.code}
                                    >
                                        {language.nativeName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {auth.enabled && auth.authenticated ? (
                <div className="flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-border/70 px-4"
                        onClick={() => void auth.logout()}
                    >
                        <LogOut className="mr-2 size-4" />
                        Log out
                    </Button>
                </div>
            ) : null}
        </div>
    );

    const renderAccount = () => (
        <div className="space-y-4">
            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Workspace snapshot
                    </CardTitle>
                    <p className={subtleTextClasses}>
                        Current saved workspace counts available in this
                        session.
                    </p>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={Mail}
                        title="Collections"
                        value={workspaceSnapshot.collectionCount}
                    />
                    <DetailRow
                        icon={Shield}
                        title="Projects"
                        value={workspaceSnapshot.projectCount}
                    />
                    <DetailRow
                        icon={Shield}
                        title="Diagrams"
                        value={workspaceSnapshot.diagramCount}
                    />
                </CardContent>
            </Card>
            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Account Details
                    </CardTitle>
                    <p className={subtleTextClasses}>
                        The current user context attached to this SchemaDash
                        session.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <AccountInfoField
                        icon={KeyRound}
                        label="Auth provider"
                        value={
                            auth.user?.authProvider ??
                            (auth.enabled
                                ? (auth.mode ?? 'enabled')
                                : 'disabled')
                        }
                    />
                    <AccountInfoField
                        icon={LayoutGrid}
                        label="Status"
                        value={
                            auth.user?.status ??
                            (auth.authenticated ? 'active' : 'local')
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );

    const renderApiKeys = () => (
        <Card className={panelCardClasses}>
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-foreground">
                    API Keys
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[15px] text-muted-foreground">
                <p>
                    API key management is not configured in this workspace yet.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/70"
                    disabled
                >
                    Generate key
                </Button>
            </CardContent>
        </Card>
    );

    const renderAppearance = () => (
        <Card className={panelCardClasses}>
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-foreground">
                    Appearance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className={subtleTextClasses}>Theme</div>
                <Select
                    onValueChange={(value) =>
                        localConfig.setTheme(
                            value as 'light' | 'dark' | 'system'
                        )
                    }
                    value={localConfig.theme}
                >
                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background text-[15px] text-foreground shadow-none">
                        <SelectValue placeholder="Choose theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );

    const renderCanvas = () => (
        <div className="space-y-4">
            <Card className={panelCardClasses}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-foreground">
                        Canvas Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={CreditCard}
                        title="Show cardinality"
                        value="Keep relationship cardinality markers visible in diagrams"
                    />
                    <SettingSwitch
                        checked={localConfig.showCardinality}
                        onClick={() =>
                            localConfig.setShowCardinality(
                                !localConfig.showCardinality
                            )
                        }
                    />
                </CardContent>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={CreditCard}
                        title="Show field attributes"
                        value="Display PK, nullability, and field metadata on the canvas"
                    />
                    <SettingSwitch
                        checked={localConfig.showFieldAttributes}
                        onClick={() =>
                            localConfig.setShowFieldAttributes(
                                !localConfig.showFieldAttributes
                            )
                        }
                    />
                </CardContent>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={CreditCard}
                        title="Show minimap"
                        value="Keep the minimap visible by default"
                    />
                    <SettingSwitch
                        checked={localConfig.showMiniMapOnCanvas}
                        onClick={() =>
                            localConfig.setShowMiniMapOnCanvas(
                                !localConfig.showMiniMapOnCanvas
                            )
                        }
                    />
                </CardContent>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={CreditCard}
                        title="Show database views"
                        value="Include database views when the source supports them"
                    />
                    <SettingSwitch
                        checked={localConfig.showDBViews}
                        onClick={() =>
                            localConfig.setShowDBViews(!localConfig.showDBViews)
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );

    const renderSubscription = () => (
        <Card className={panelCardClasses}>
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-foreground">
                    Subscription
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[15px]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="font-medium text-foreground">
                            Team Plan
                        </div>
                        <div className="text-muted-foreground">
                            Basic workspace access for the current session.
                        </div>
                    </div>
                    <Badge className="rounded-xl bg-muted px-3 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted">
                        Basic (Trial)
                    </Badge>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-border/70"
                >
                    Check Plans
                </Button>
            </CardContent>
        </Card>
    );

    const detailContent = (() => {
        switch (selectedSection) {
            case 'account':
                return renderAccount();
            case 'api-keys':
                return renderApiKeys();
            case 'canvas':
                return renderCanvas();
            case 'appearance':
                return renderAppearance();
            case 'subscription':
                return renderSubscription();
            case 'profile':
            default:
                return renderProfile();
        }
    })();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-border/70 bg-background p-0 text-foreground shadow-2xl sm:max-w-[980px] sm:rounded-xl">
                <div className="sr-only">
                    <DialogTitle>Workspace settings</DialogTitle>
                    <DialogDescription>
                        Settings dialog for profile, canvas, appearance, and
                        subscription preferences.
                    </DialogDescription>
                </div>

                <div className="grid min-h-[720px] grid-cols-[228px_minmax(0,1fr)]">
                    <aside className="bg-muted/35">
                        <div className="flex h-full flex-col">
                            {sections.map((section, sectionIndex) => (
                                <div key={section.group}>
                                    <div className="px-5 pb-3 pt-5 text-[15px] font-medium text-muted-foreground">
                                        {section.group}
                                    </div>
                                    <div className="space-y-1 px-2">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const active =
                                                item.id === selectedSection;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={cn(
                                                        navItemClasses,
                                                        active
                                                            ? 'bg-accent text-accent-foreground'
                                                            : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
                                                    )}
                                                    onClick={() =>
                                                        setSelectedSection(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    <Icon className="size-4 shrink-0 text-current" />
                                                    <span className="font-medium">
                                                        {item.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {sectionIndex < sections.length - 1 ? (
                                        <Separator className="mt-5 bg-border/70" />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="bg-background">
                        <div className="flex h-full flex-col">
                            <header className="flex items-center gap-4 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-6 items-center justify-center rounded-md border border-border/70 bg-background text-foreground">
                                        <ActiveIcon className="size-3.5" />
                                    </div>
                                    <Separator
                                        orientation="vertical"
                                        className="h-5 bg-border/70"
                                    />
                                </div>
                                <h2 className="text-[32px] font-medium tracking-[-0.03em] text-foreground">
                                    {activeSection.label}
                                </h2>
                            </header>

                            <div className="flex-1 overflow-auto px-4 pb-5">
                                <div className="mx-auto max-w-[760px] space-y-4">
                                    {detailContent}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <DialogClose asChild>
                    <button className="absolute right-5 top-5 rounded-sm text-muted-foreground transition-colors hover:text-foreground">
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};
