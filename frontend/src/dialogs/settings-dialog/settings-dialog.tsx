import React, { useEffect, useMemo, useState } from 'react';
import {
    CreditCard,
    Globe,
    KeyRound,
    LayoutGrid,
    LogOut,
    Mail,
    Palette,
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
import { DashboardSettingOptionCard } from '@/components/dashboard-page/dashboard-setting-option-card';
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
import { useConfig } from '@/hooks/use-config';
import { useLocalConfig } from '@/hooks/use-local-config';
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
            checked ? 'bg-rose-500' : 'bg-stone-300'
        )}
        onClick={onClick}
    >
        <span
            className={cn(
                'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
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
            <div className="flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <div className="text-[15px] font-medium text-stone-900">
                    {title}
                </div>
                <div className="truncate text-[15px] text-stone-500">
                    {value}
                </div>
            </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
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
    const { config } = useConfig();
    const localConfig = useLocalConfig();
    const translation = useTranslation();
    const i18n = translation.i18n ?? {
        changeLanguage: async () => undefined,
        languages: ['en'],
    };
    const [selectedSection, setSelectedSection] =
        useState<SettingsSectionId>('profile');
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedSection('profile');
    }, [open]);

    const displayName =
        auth.user?.displayName?.trim() ||
        auth.user?.email?.trim() ||
        'Local SchemaDash user';
    const email = auth.user?.email?.trim() || 'Not available';
    const currentLanguage =
        i18n.languages.find((code) =>
            languages.some((language) => language.code === code)
        ) ?? languages[0]?.code;

    const activeTitle = useMemo(() => {
        return (
            sections
                .flatMap((section) => section.items)
                .find((item) => item.id === selectedSection)?.label ?? 'Profile'
        );
    }, [selectedSection]);

    const renderProfile = () => (
        <div className="space-y-4">
            <Card className="rounded-[18px] border-stone-200 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-stone-900">
                        Account Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 pt-0">
                    <DetailRow
                        icon={Mail}
                        title="Email address"
                        value={
                            <span className="font-semibold text-stone-900">
                                {email}
                            </span>
                        }
                    />
                    <div className="shrink-0 space-y-2 text-right">
                        <Badge className="rounded-xl bg-stone-100 px-3 py-1 text-[13px] font-medium text-stone-700 hover:bg-stone-100">
                            Team Plan (Basic) (Trial)
                        </Badge>
                        <div className="text-[14px] font-medium text-rose-500">
                            Check Plans
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[18px] border-stone-200 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-stone-900">
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

            <Card className="rounded-[18px] border-stone-200 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-stone-900">
                        Language
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                        <div className="flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                            <Globe className="size-4" />
                        </div>
                        <Select
                            onValueChange={(value) => {
                                void i18n.changeLanguage(value);
                            }}
                            value={currentLanguage}
                        >
                            <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white text-[15px] shadow-none">
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
                        className="h-11 rounded-xl border-stone-200 px-4"
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
        <Card className="rounded-[18px] border-stone-200 shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-stone-900">
                    Account
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[15px]">
                <DetailRow
                    icon={UserRound}
                    title="Display name"
                    value={
                        <span className="font-semibold text-stone-900">
                            {displayName}
                        </span>
                    }
                />
                <DetailRow
                    icon={Mail}
                    title="Authentication"
                    value={`${auth.enabled ? (auth.mode ?? 'enabled') : 'disabled'} / ${auth.user?.status ?? 'local'}`}
                />
                <DetailRow
                    icon={CreditCard}
                    title="Default diagram"
                    value={config?.defaultDiagramId ?? 'Not set'}
                />
            </CardContent>
        </Card>
    );

    const renderApiKeys = () => (
        <Card className="rounded-[18px] border-stone-200 shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-stone-900">
                    API Keys
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[15px] text-stone-500">
                <p>
                    API key management is not configured in this workspace yet.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-stone-200"
                    disabled
                >
                    Generate key
                </Button>
            </CardContent>
        </Card>
    );

    const renderAppearance = () => (
        <Card className="rounded-[18px] border-stone-200 shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-stone-900">
                    Appearance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="text-[15px] text-stone-500">Theme</div>
                <Select
                    onValueChange={(value) =>
                        localConfig.setTheme(
                            value as 'light' | 'dark' | 'system'
                        )
                    }
                    value={localConfig.theme}
                >
                    <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white text-[15px] shadow-none">
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
            <div className="space-y-1">
                <h3 className="text-[18px] font-semibold text-stone-900">
                    Canvas
                </h3>
                <p className="text-[15px] text-stone-500">
                    Diagram display and canvas toggles.
                </p>
            </div>

            <Card className="rounded-[18px] border-stone-200 shadow-none">
                <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-semibold text-stone-900">
                        Canvas preferences
                    </CardTitle>
                    <p className="text-[15px] text-stone-500">
                        Toggle the default diagram presentation options for the
                        current browser session.
                    </p>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                    <DashboardSettingOptionCard
                        checked={localConfig.showCardinality}
                        description="Keep relationship cardinality markers visible in diagrams."
                        onCheckedChange={(checked) =>
                            localConfig.setShowCardinality(checked)
                        }
                        title="Show cardinality"
                    />
                    <DashboardSettingOptionCard
                        checked={localConfig.showFieldAttributes}
                        description="Display PK, nullability, and field metadata on the canvas."
                        onCheckedChange={(checked) =>
                            localConfig.setShowFieldAttributes(checked)
                        }
                        title="Show field attributes"
                    />
                    <DashboardSettingOptionCard
                        checked={localConfig.showMiniMapOnCanvas}
                        description="Keep the minimap visible by default."
                        onCheckedChange={(checked) =>
                            localConfig.setShowMiniMapOnCanvas(checked)
                        }
                        title="Show minimap"
                    />
                    <DashboardSettingOptionCard
                        checked={localConfig.showDBViews}
                        description="Include database views when the source supports them."
                        onCheckedChange={(checked) =>
                            localConfig.setShowDBViews(checked)
                        }
                        title="Show database views"
                    />
                </CardContent>
            </Card>
        </div>
    );

    const renderSubscription = () => (
        <Card className="rounded-[18px] border-stone-200 shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold text-stone-900">
                    Subscription
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-[15px]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="font-medium text-stone-900">
                            Team Plan
                        </div>
                        <div className="text-stone-500">
                            Basic workspace access for the current session.
                        </div>
                    </div>
                    <Badge className="rounded-xl bg-stone-100 px-3 py-1 text-[13px] font-medium text-stone-700 hover:bg-stone-100">
                        Basic (Trial)
                    </Badge>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-stone-200"
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
            <DialogContent className="overflow-hidden border-stone-200 bg-white p-0 shadow-2xl sm:max-w-[980px] sm:rounded-xl">
                <div className="sr-only">
                    <DialogTitle>Workspace settings</DialogTitle>
                    <DialogDescription>
                        Settings dialog for profile, appearance, and
                        subscription preferences.
                    </DialogDescription>
                </div>

                <div className="grid min-h-[720px] grid-cols-[228px_minmax(0,1fr)]">
                    <aside className="bg-stone-50/80">
                        <div className="flex h-full flex-col">
                            {sections.map((section, sectionIndex) => (
                                <div key={section.group}>
                                    <div className="px-5 pb-3 pt-5 text-[15px] font-medium text-stone-500">
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
                                                            ? 'bg-stone-100 text-stone-950'
                                                            : 'text-stone-600 hover:bg-stone-100/80'
                                                    )}
                                                    onClick={() =>
                                                        setSelectedSection(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    <Icon className="size-4 shrink-0 text-stone-500" />
                                                    <span className="font-medium">
                                                        {item.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {sectionIndex < sections.length - 1 ? (
                                        <Separator className="mt-5 bg-stone-200" />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="bg-white">
                        <div className="flex h-full flex-col">
                            <header className="flex items-center gap-4 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-6 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-900">
                                        <UserRound className="size-3.5" />
                                    </div>
                                    <Separator
                                        orientation="vertical"
                                        className="h-5 bg-stone-200"
                                    />
                                </div>
                                <h2 className="text-[32px] font-medium tracking-[-0.03em] text-stone-900">
                                    {activeTitle}
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
                    <button className="absolute right-5 top-5 rounded-sm text-stone-500 transition-colors hover:text-stone-900">
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};
