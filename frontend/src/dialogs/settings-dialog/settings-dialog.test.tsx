import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { SettingsDialog } from './settings-dialog';

const logoutMock = vi.fn();
const setShowCardinalityMock = vi.fn();
const setShowDBViewsMock = vi.fn();
const setShowFieldAttributesMock = vi.fn();
const setShowMiniMapOnCanvasMock = vi.fn();
const setThemeMock = vi.fn();
const listCollectionsMock = vi.fn();
const listProjectsMock = vi.fn();
const listProjectDiagramsMock = vi.fn();
const translationMap = {
    settings_dialog: {
        dialog_title: 'إعدادات مساحة العمل',
        dialog_description:
            'نافذة إعدادات الملف الشخصي ولوحة الرسم والمظهر وخيارات الاشتراك.',
        close: 'إغلاق',
        toggle_setting: 'تبديل الإعداد',
        groups: {
            general: 'عام',
            billing: 'الفوترة',
        },
        sections: {
            profile: 'الملف الشخصي',
            account: 'الحساب',
            api_keys: 'مفاتيح API',
            canvas: 'لوحة الرسم',
            appearance: 'المظهر',
            subscription: 'الاشتراك',
        },
        profile: {
            account_details: 'تفاصيل الحساب',
            display_name: 'الاسم الظاهر',
            email_address: 'البريد الإلكتروني',
            role: 'الدور',
            team_plan: 'خطة الفريق (أساسية) (تجريبية)',
            check_plans: 'عرض الخطط',
            auto_save_settings: 'إعدادات الحفظ التلقائي',
            auto_save: 'الحفظ التلقائي',
            auto_save_description: 'احفظ تغييراتك تلقائيًا',
            language: 'اللغة',
            choose_language: 'اختر اللغة',
            log_out: 'تسجيل الخروج',
        },
        account: {
            workspace_snapshot: 'ملخص مساحة العمل',
            workspace_description:
                'أعداد العناصر المحفوظة المتاحة في هذه الجلسة الحالية.',
            collections: 'المجموعات',
            projects: 'المشاريع',
            diagrams: 'المخططات',
            account_details: 'تفاصيل الحساب',
            account_description:
                'سياق المستخدم الحالي المرتبط بهذه الجلسة في SchemaDash.',
            auth_provider: 'موفر المصادقة',
            status: 'الحالة',
        },
        api_keys: {
            title: 'مفاتيح API',
            description:
                'إدارة مفاتيح API غير مهيأة في مساحة العمل هذه حتى الآن.',
            generate: 'إنشاء مفتاح',
        },
        appearance: {
            title: 'المظهر',
            theme: 'السمة',
            choose_theme: 'اختر السمة',
            system: 'النظام',
            light: 'فاتح',
            dark: 'داكن',
        },
        canvas: {
            title: 'تفضيلات لوحة الرسم',
            show_cardinality: 'إظهار الكاردينالية',
            show_cardinality_description:
                'أبقِ علامات الكاردينالية للعلاقات ظاهرة في المخططات',
            show_field_attributes: 'إظهار خصائص الحقول',
            show_field_attributes_description:
                'اعرض المفتاح الأساسي وقابلية القيمة الفارغة وبيانات الحقول على اللوحة',
            show_minimap: 'إظهار الخريطة المصغرة',
            show_minimap_description: 'أبقِ الخريطة المصغرة ظاهرة افتراضيًا',
            show_views: 'إظهار العروض',
            show_views_description:
                'ضمّن عروض قواعد البيانات عندما يدعمها المصدر',
        },
        subscription: {
            title: 'الاشتراك',
            plan_title: 'خطة الفريق',
            plan_description: 'وصول أساسي لمساحة العمل في الجلسة الحالية.',
            badge: 'أساسي (تجريبي)',
            check_plans: 'عرض الخطط',
        },
        values: {
            local_user: 'مستخدم SchemaDash محلي',
            not_available: 'غير متوفر',
            local: 'محلي',
            active: 'نشط',
            disabled: 'معطل',
            enabled: 'مفعل',
        },
    },
} as const;

const translate = (key: string) =>
    key.split('.').reduce<unknown>((value, part) => {
        if (value && typeof value === 'object' && part in value) {
            return (value as Record<string, unknown>)[part];
        }

        return key;
    }, translationMap) ?? key;

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        authenticated: true,
        enabled: true,
        mode: 'local',
        serverReachable: true,
        logout: logoutMock,
        user: {
            email: 'wweziz37@gmail.com',
            displayName: 'Wweziz',
        },
    }),
}));

vi.mock('@/hooks/use-config', () => ({
    useConfig: () => ({
        config: {
            defaultDiagramId: 'diagram-1',
        },
    }),
}));

vi.mock('@/hooks/use-local-config', () => ({
    useLocalConfig: () => ({
        setShowCardinality: setShowCardinalityMock,
        setShowDBViews: setShowDBViewsMock,
        setShowFieldAttributes: setShowFieldAttributesMock,
        setShowMiniMapOnCanvas: setShowMiniMapOnCanvasMock,
        setTheme: setThemeMock,
        showCardinality: true,
        showDBViews: true,
        showFieldAttributes: true,
        showMiniMapOnCanvas: true,
        theme: 'system',
    }),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({
        listCollections: listCollectionsMock,
        listProjects: listProjectsMock,
        listProjectDiagrams: listProjectDiagramsMock,
    }),
}));

vi.mock('@/i18n/i18n', () => ({
    languages: [
        {
            code: 'ar',
            name: 'Arabic',
            nativeName: 'العربية',
        },
    ],
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: translate,
        i18n: {
            changeLanguage: vi.fn(),
            languages: ['ar'],
        },
    }),
}));

describe('SettingsDialog', () => {
    beforeEach(() => {
        logoutMock.mockReset();
        setShowCardinalityMock.mockReset();
        setShowDBViewsMock.mockReset();
        setShowFieldAttributesMock.mockReset();
        setShowMiniMapOnCanvasMock.mockReset();
        setThemeMock.mockReset();
        listCollectionsMock.mockReset();
        listProjectsMock.mockReset();
        listProjectDiagramsMock.mockReset();
        listCollectionsMock.mockResolvedValue([{ id: 'collection-1' }]);
        listProjectsMock.mockResolvedValue([
            { id: 'project-1', status: 'active' },
            { id: 'project-2', status: 'active' },
            { id: 'project-3', status: 'deleted' },
        ]);
        listProjectDiagramsMock.mockImplementation(async (projectId: string) =>
            projectId === 'project-1'
                ? [{ id: 'diagram-1' }]
                : [{ id: 'diagram-2' }]
        );
    });

    it('renders the profile-styled settings modal and switches sections', async () => {
        const user = userEvent.setup();

        render(
            <TooltipProvider>
                <SettingsDialog open onOpenChange={vi.fn()} />
            </TooltipProvider>
        );

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('إعدادات مساحة العمل')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'الملف الشخصي' })
        ).toBeInTheDocument();
        expect(screen.getAllByText('تفاصيل الحساب').length).toBeGreaterThan(0);
        expect(screen.getByText('إعدادات الحفظ التلقائي')).toBeInTheDocument();
        expect(screen.getByText('اللغة')).toBeInTheDocument();
        expect(screen.queryByText('All Diagrams')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'لوحة الرسم' }));
        expect(
            screen.getByRole('heading', { name: 'لوحة الرسم' })
        ).toBeInTheDocument();
        expect(screen.getByText('تفضيلات لوحة الرسم')).toBeInTheDocument();
        expect(screen.getByText('إظهار الخريطة المصغرة')).toBeInTheDocument();
        expect(screen.getByText('إظهار العروض')).toBeInTheDocument();

        await user.click(
            screen.getAllByRole('button', { name: 'تبديل الإعداد' })[3]
        );
        expect(setShowDBViewsMock).toHaveBeenCalledWith(false);

        await user.click(screen.getByRole('button', { name: 'المظهر' }));
        expect(screen.getAllByText('المظهر').length).toBeGreaterThan(0);
        expect(screen.getByText('السمة')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveClass('bg-background');
        expect(screen.getByRole('combobox', { name: '' })).toHaveClass(
            'bg-background'
        );

        await user.click(screen.getByRole('button', { name: 'لوحة الرسم' }));
        expect(screen.getByText('إظهار الخريطة المصغرة')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'الحساب' }));
        expect(screen.getAllByText('تفاصيل الحساب').length).toBeGreaterThan(0);
        expect(screen.getByText('موفر المصادقة')).toBeInTheDocument();
        expect(screen.getAllByText('محلي').length).toBeGreaterThan(0);
        expect(screen.getByText('الحالة')).toBeInTheDocument();
        expect(screen.getByText('ملخص مساحة العمل')).toBeInTheDocument();
        expect(
            screen.getByText(
                'أعداد العناصر المحفوظة المتاحة في هذه الجلسة الحالية.'
            )
        ).toBeInTheDocument();
        const workspaceCard = screen
            .getByText('ملخص مساحة العمل')
            .closest('[class*="rounded-"]');
        expect(workspaceCard).not.toBeNull();
        const workspaceScope = within(workspaceCard as HTMLElement);
        expect(workspaceScope.getByText('المجموعات')).toBeInTheDocument();
        expect(workspaceScope.getByText('المشاريع')).toBeInTheDocument();
        expect(workspaceScope.getByText('المخططات')).toBeInTheDocument();
        expect(workspaceScope.getByText('1')).toBeInTheDocument();
        expect(workspaceScope.getAllByText('2').length).toBe(2);

        await user.click(screen.getByRole('button', { name: 'الاشتراك' }));
        expect(screen.getAllByText('الاشتراك').length).toBeGreaterThan(0);
        expect(screen.getByText('عرض الخطط')).toBeInTheDocument();
    });
});
