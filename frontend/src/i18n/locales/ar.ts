import type { LanguageMetadata, LanguageTranslation } from '../types';

export const ar: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'جديد',
            browse: 'فتح',
            tables: 'الجداول',
            refs: 'المراجع',
            dependencies: 'التبعيات',
            custom_types: 'الأنواع المخصصة',
            visuals: 'مرئيات',
            versions: 'الإصدارات',
        },
        menu: {
            actions: {
                actions: 'الإجراءات',
                new: 'جديد...',
                browse: 'جميع قواعد البيانات...',
                save: 'حفظ',
                import: 'استيراد قاعدة بيانات',
                export_sql: 'SQL تصدير',
                export_as: 'تصدير كـ',
                delete_diagram: 'حذف',
            },
            edit: {
                edit: 'تحرير',
                undo: 'تراجع',
                redo: 'إعادة',
                clear: 'مسح',
            },
            view: {
                view: 'عرض',
                show_sidebar: 'إظهار الشريط الجانبي',
                hide_sidebar: 'إخفاء الشريط الجانبي',
                hide_cardinality: 'إخفاء الكاردينالية',
                show_cardinality: 'إظهار الكاردينالية',
                hide_field_attributes: 'إخفاء خصائص الحقل',
                show_field_attributes: 'إظهار خصائص الحقل',
                zoom_on_scroll: 'تكبير/تصغير عند التمرير',
                show_views: 'عروض قاعدة البيانات',
                theme: 'المظهر',
                show_dependencies: 'إظهار الاعتمادات',
                hide_dependencies: 'إخفاء الاعتمادات',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            backup: {
                backup: 'النسخ الاحتياطي',
                export_diagram: 'تصدير المخطط',
                restore_diagram: 'استعادة المخطط',
            },
            help: {
                help: 'مساعدة',
                docs_website: 'الوثائق',
                join_discord: 'انضم إلينا على Discord',
            },
        },

        delete_diagram_alert: {
            title: 'حذف المخطط',
            description:
                '.لا يمكن التراجع عن هذا الإجراء. سيتم حذف الرسم البياني بشكل دائم',
            cancel: 'إلغاء',
            delete: 'حذف',
        },

        clear_diagram_alert: {
            title: 'مسح الرسم البياني',
            description:
                '.لا يمكن التراجع عن هذا الاجراء. سيتم حذف جميع البيانات في الرسم البياني بشكل دائم',
            cancel: 'إلغاء',
            clear: 'مسح',
        },

        reorder_diagram_alert: {
            title: 'ترتيب تلقائي للرسم البياني',
            description:
                'هذا الإجراء سيقوم بإعادة ترتيب الجداول في المخطط بشكل تلقائي. هل تريد المتابعة؟',
            reorder: 'ترتيب تلقائي',
            cancel: 'إلغاء',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'فشل النسخ',
                description: '.الحافظة غير مدعومة',
            },
            failed: {
                title: 'فشل النسخ',
                description: 'حدث خطأ أثناء النسخ. حاول مجدداً',
            },
        },

        theme: {
            system: 'النظام',
            light: 'فاتح',
            dark: 'داكن',
        },

        zoom: {
            on: 'تشغيل',
            off: 'إيقاف',
        },

        last_saved: 'آخر حفظ',
        saved: 'تم الحفظ',
        loading_diagram: '...جارِ تحميل الرسم البياني',
        deselect_all: 'إلغاء تحديد الكل',
        select_all: 'تحديد الكل',
        clear: 'مسح',
        show_more: 'عرض المزيد',
        show_less: 'عرض أقل',
        copy_to_clipboard: 'نسخ إلى الحافظة',
        copied: '!تم النسخ',

        side_panel: {
            view_all_options: '...عرض جميع الخيارات',
            tables_section: {
                tables: 'الجداول',
                add_table: 'إضافة جدول',
                add_view: 'إضافة عرض',
                filter: 'تصفية',
                collapse: 'طي الكل',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',
                all_hidden: 'جميع الجداول مخفية',
                show_all: 'عرض الكل',

                table: {
                    fields: 'الحقول',
                    nullable: 'يمكن ان يكون فارغاً؟',
                    primary_key: 'المفتاح الأساسي',
                    indexes: 'الفهارس',
                    check_constraints: 'قيود التحقق',
                    comments: 'تعليقات',
                    no_comments: 'لا توجد تعليقات',
                    add_field: 'إضافة حقل',
                    add_index: 'إضافة فهرس',
                    add_check: 'إضافة تحقق',
                    index_select_fields: 'حدد الحقول',
                    no_types_found: 'لا يوجد أنواع',
                    field_name: 'الإسم',
                    field_type: 'النوع',
                    field_actions: {
                        title: 'خصائص الحقل',
                        unique: 'فريد',
                        auto_increment: 'زيادة تلقائية',
                        comments: 'تعليقات',
                        no_comments: 'لا يوجد تعليقات',
                        delete_field: 'حذف الحقل',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'الدقة',
                        scale: 'النطاق',
                        default_value: 'Default Value',
                        no_default: 'No default',
                    },
                    index_actions: {
                        title: 'خصائص الفهرس',
                        name: 'الإسم',
                        unique: 'فريد',
                        index_type: 'نوع الفهرس',
                        delete_index: 'حذف الفهرس',
                    },
                    check_constraint_actions: {
                        title: 'قيد التحقق',
                        expression: 'التعبير',
                        delete: 'حذف قيد التحقق',
                    },
                    table_actions: {
                        title: 'إجراءات الجدول',
                        change_schema: 'تغيير المخطط',
                        add_field: 'إضافة حقل',
                        add_index: 'إضافة فهرس',
                        duplicate_table: 'نسخ الجدول',
                        delete_table: 'حذف الجدول',
                    },
                },
                empty_state: {
                    title: 'لا توجد جداول',
                    description: 'أنشئ جدولاً للبدء',
                },
            },
            refs_section: {
                refs: 'المراجع',
                filter: 'تصفية',
                collapse: 'طي الكل',
                add_relationship: 'إضافة علاقة',
                relationships: 'العلاقات',
                dependencies: 'الاعتمادات',
                relationship: {
                    relationship: 'العلاقة',
                    primary: 'الجدول الأساسي',
                    foreign: 'الجدول المرتبط',
                    cardinality: 'الكاردينالية',
                    delete_relationship: 'حذف',
                    switch_tables: 'تبديل الجداول',
                    relationship_actions: {
                        title: 'إجراءات',
                        delete_relationship: 'حذف',
                    },
                },
                dependency: {
                    dependency: 'الاعتماد',
                    table: 'الجدول',
                    dependent_table: 'عرض الاعتمادات',
                    delete_dependency: 'حذف',
                    dependency_actions: {
                        title: 'إجراءات',
                        delete_dependency: 'حذف',
                    },
                },
                empty_state: {
                    title: 'لا توجد علاقات',
                    description: 'إنشاء علاقة للبدء',
                },
            },

            areas_section: {
                areas: 'المناطق',
                add_area: 'إضافة منطقة',
                filter: 'تصفية',
                clear: 'مسح التصفية',
                no_results: 'لم يتم العثور على مناطق مطابقة للتصفية.',

                area: {
                    area_actions: {
                        title: 'إجراءات المنطقة',
                        edit_name: 'تحرير الاسم',
                        delete_area: 'حذف المنطقة',
                    },
                },
                empty_state: {
                    title: 'لا توجد مناطق',
                    description: 'أنشئ منطقة للبدء',
                },
            },

            visuals_section: {
                visuals: 'مرئيات',
                tabs: {
                    areas: 'المناطق',
                    notes: 'ملاحظات',
                },
            },

            versions_section: {
                versions: 'الإصدارات',
                filter: 'تصفية الإصدارات',
                add_version: 'إنشاء إصدار',
                clear: 'مسح التصفية',
                no_results: 'لم يتم العثور على إصدارات مطابقة للتصفية.',
                tabs: {
                    version: 'الاصدارات',
                    changelog: 'سجل التغييرات',
                },
                empty_state: {
                    title: 'لا توجد إصدارات',
                    description:
                        'أنشئ لقطة ثابتة لمراجعتها أو استعادتها لاحقاً.',
                },
            },

            notes_section: {
                filter: 'تصفية',
                add_note: 'إضافة ملاحظة',
                no_results: 'لم يتم العثور على ملاحظات',
                clear: 'مسح التصفية',
                empty_state: {
                    title: 'لا توجد ملاحظات',
                    description: 'أنشئ ملاحظة لإضافة تعليقات نصية على اللوحة',
                },
                note: {
                    empty_note: 'ملاحظة فارغة',
                    note_actions: {
                        title: 'إجراءات الملاحظة',
                        edit_content: 'تحرير المحتوى',
                        delete_note: 'حذف الملاحظة',
                    },
                },
            },

            custom_types_section: {
                custom_types: 'الأنواع المخصصة',
                filter: 'تصفية',
                clear: 'مسح التصفية',
                no_results: 'لم يتم العثور على أنواع مخصصة مطابقة للتصفية.',
                new_type: 'نوع جديد',
                empty_state: {
                    title: 'لا توجد أنواع مخصصة',
                    description:
                        'ستظهر الأنواع المخصصة هنا عندما تكون متاحة في قاعدة البيانات الخاصة بك',
                },
                custom_type: {
                    kind: 'النوع',
                    enum_values: 'قيم التعداد',
                    composite_fields: 'الحقول',
                    no_fields: 'لم يتم تحديد حقول',
                    no_values: 'لم يتم تحديد قيم التعداد',
                    field_name_placeholder: 'اسم الحقل',
                    field_type_placeholder: 'اختر النوع',
                    add_field: 'إضافة حقل',
                    no_fields_tooltip: 'لم يتم تحديد حقول لهذا النوع المخصص',
                    custom_type_actions: {
                        title: 'إجراءات',
                        highlight_fields: 'تمييز الحقول',
                        delete_custom_type: 'حذف',
                        clear_field_highlight: 'إزالة التمييز',
                    },
                    delete_custom_type: 'حذف النوع',
                },
            },
        },

        toolbar: {
            zoom_in: 'تكبير',
            zoom_out: 'تصغير',
            save: 'حفظ',
            show_all: 'عرض الكل',
            undo: 'تراجع',
            redo: 'إعادة',
            reorder_diagram: 'ترتيب تلقائي للرسم البياني',
            highlight_overlapping_tables: 'تمييز الجداول المتداخلة',
            filter: 'تصفية الجداول',
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
        },

        new_diagram_dialog: {
            database_selection: {
                title: 'ما هو نوع قاعدة البيانات الخاصة بك؟',
                description:
                    'تتمتع كل قاعدة بيانات بمميزاتها وقدراتها الفريدة.',
                check_examples_long: 'ألقي نظرة على الأمثلة',
                check_examples_short: 'أمثلة',
            },

            import_database: {
                title: 'إسترد قاعدة بياناتك',
                database_edition: ':إصدار قاعدة البيانات',
                step_1: ':قم بتشغيل هذا البرنامج النصي في قاعدة بياناتك',
                step_2: ':إلصق نتيجة البرنامج النصي هنا →',
                script_results_placeholder: '...نتيجة البرنامج النصي هنا',
                ssms_instructions: {
                    button_text: 'SSMS تعليمات',
                    title: 'تعليمات',
                    step_1: 'SQL SERVER < انتقل إلى الأدوات > الخيارات > نتائح الاستعلام',
                    step_2: '(اضبطها على 9999999) XML اذا كنت تستخدم "نتائج إلى الشبكة"، قم بتغيير الحد الاقصى للاحرف المستردة للبيانات غير',
                },
                instructions_link: 'تحتاج مساعدة؟ شاهد الفيديو',
                check_script_result: 'تحقق من نتيجة البرنامج النصي',
            },

            cancel: 'إلغاء',
            import_from_file: 'استيراد من ملف',
            back: 'رجوع',
            empty_diagram: 'قاعدة بيانات فارغة',
            continue: 'متابعة',
            import: 'استيراد',
        },

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
                show_minimap_description:
                    'أبقِ الخريطة المصغرة ظاهرة افتراضيًا',
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

        open_diagram_dialog: {
            title: 'فتح قاعدة بيانات محفوظة',
            description:
                'استعرض المشاريع المحفوظة وافتح مخططًا من التخزين الدائم.',
            collections: 'المجموعات',
            projects: 'المشاريع',
            all_projects: 'كل المشاريع',
            all_projects_description:
                'استعرض جميع المشاريع المحفوظة في مساحة عملك.',
            search_label: 'البحث في المكتبة',
            search_placeholder:
                'ابحث في المشاريع والمخططات والأوصاف والمجموعات والجداول والمخططات الهيكلية',
            search_help:
                'البحث غير حساس لحالة الأحرف ويطابق بيانات المشروع وأسماء المجموعات وتفاصيل المخططات وأسماء الجداول أو المخططات المحفوظة.',
            unassigned_collection: 'غير منظم',
            unassigned_collection_description:
                'المشاريع التي لم تُسند إلى مجموعة بعد.',
            empty_collections:
                'لا توجد مجموعات بعد. أنشئ مجموعة عندما تريد تنظيم المشاريع.',
            empty_search_collections: 'لا توجد مجموعات تطابق "{{search}}".',
            empty_projects: 'لا توجد مشاريع محفوظة بعد.',
            empty_search_projects: 'لا توجد مشاريع تطابق "{{search}}".',
            empty_diagrams: 'لا توجد مخططات محفوظة في هذا المشروع بعد.',
            empty_search_diagrams:
                'لا توجد مخططات في هذا المشروع تطابق "{{search}}".',
            no_project_selected: 'اختر مشروعًا',
            collection_count: '{{count}} مشاريع',
            project_count: '{{count}} مخططات',
            table_columns: {
                name: 'الاسم',
                created_at: 'تاريخ الإنشاء',
                last_modified: 'آخر تعديل',
                tables_count: 'الجداول',
            },
            cancel: 'إلغاء',
            open: 'فتح',
            new_database: 'قاعدة بيانات جديدة',
            collection_actions: {
                create: 'جديد',
                create_prompt: 'أدخل اسم المجموعة',
                description_prompt: 'أدخل وصفًا اختياريًا للمجموعة',
                rename: 'إعادة تسمية',
                rename_prompt: 'أعد تسمية هذه المجموعة',
                delete: 'حذف',
                delete_description:
                    'سيؤدي هذا إلى حذف "{{name}}" وترك مشاريعه بدون تنظيم.',
            },
            project_actions: {
                create: 'مشروع جديد',
                create_prompt: 'أدخل اسم المشروع',
                description_prompt: 'أدخل وصفًا اختياريًا للمشروع',
                rename: 'إعادة تسمية المشروع',
                rename_prompt: 'أعد تسمية هذا المشروع',
                delete: 'حذف المشروع',
                delete_description:
                    'سيؤدي هذا إلى حذف "{{name}}" نهائيًا وجميع المخططات المحفوظة بداخله.',
            },
            project_fields: {
                collection: 'المجموعة',
                collection_placeholder: 'اختر مجموعة',
            },

            diagram_actions: {
                open: 'فتح',
                rename: 'إعادة تسمية',
                rename_prompt: 'أعد تسمية هذا المخطط',
                duplicate: 'تكرار',
                delete: 'حذف',
            },
            sharing: {
                title: 'مشاركة {{type}} "{{name}}"',
                fallback_title: 'مشاركة عنصر محفوظ',
                description:
                    'اختر ما إذا كان هذا العنصر سيبقى خاصًا أو مرئيًا للمستخدمين المسجلين أو متاحًا عبر رابط مشاركة للقراءة فقط.',
                loading: 'جارٍ تحميل إعدادات المشاركة...',
                project: 'المشروع',
                diagram: 'المخطط',
                current_status: 'المشاركة',
                share_project: 'مشاركة المشروع',
                share_diagram: 'مشاركة',
                mode_label: 'وضع المشاركة',
                mode_private: 'خاص',
                mode_authenticated: 'المستخدمون المسجلون',
                mode_link: 'أي شخص لديه الرابط',
                mode_private_help: 'يمكن فقط للمالك والمسؤولين فتح هذا العنصر.',
                mode_authenticated_help:
                    'يمكن للمستخدمين المسجلين فتح هذا العنصر بمستوى الصلاحية أدناه.',
                mode_link_help:
                    'روابط المشاركة غير قابلة للتخمين وهي للقراءة فقط في هذا الإصدار.',
                access_label: 'الصلاحية',
                access_view: 'عرض فقط',
                access_edit: 'قابل للتعديل',
                access_help:
                    'صلاحية العرض فقط تحمي من التعديلات غير المقصودة. وصلاحية التعديل مخصصة للزملاء الموثوقين المسجلين.',
                authenticated_view: 'يمكن للمستخدمين المسجلين العرض',
                authenticated_edit: 'يمكن للمستخدمين المسجلين التعديل',
                link_view: 'يمكن لأي شخص لديه الرابط العرض',
                link_read_only:
                    'مشاركات الرابط مخصصة للقراءة فقط عمدًا في الإصدار الأول.',
                link_label: 'رابط المشاركة',
                copy_link: 'نسخ الرابط',
                rotate_link: 'تدوير الرابط',
                save: 'حفظ المشاركة',
                link_ready:
                    'هذا الرابط نشط الآن. سيؤدي تدويره إلى إلغاء الرابط القديم.',
                link_inactive:
                    'فعّل مشاركة الرابط لإنشاء عنوان URL قابل للمشاركة.',
                error_load: 'تعذر تحميل إعدادات المشاركة الآن.',
                error_save: 'تعذر حفظ إعدادات المشاركة الآن.',
                error_copy: 'تعذر نسخ رابط المشاركة.',
            },
        },

        export_sql_dialog: {
            title: 'SQL تصدير',
            description:
                '{{databaseType}} صدّر مخطط الرسم البياني إلى برنامج نصي لـ',
            close: 'إغلاق',
            loading: {
                text: '...{{databaseType}} ل SQL يقوم الذكاء الاصطناعي بإنشاء',
                description: 'هذا قد يستغرق 30 ثانية',
            },
            error: {
                message:
                    'النصي. يرجى المحاولة مرة اخرى لاحقاً او <0>اتصل بنا</0> SQL خطأ في إنشاء برنامج',
                description:
                    ' الخاصة بك. راجع الدليل <0>هنا</0> OPENAI_TOKEN لا تتردد في استخدام',
            },
        },

        create_relationship_dialog: {
            title: 'إنشاء علاقة',
            primary_table: 'الجدول الأساسي',
            primary_field: 'الحقل الأساسي',
            referenced_table: 'الجدول المرتبط',
            referenced_field: 'الحقل المرتبط',
            primary_table_placeholder: 'حدد الجدول',
            primary_field_placeholder: 'حدد الحقل',
            referenced_table_placeholder: 'حدد الجدول',
            referenced_field_placeholder: 'حدد الحقل',
            no_tables_found: 'لم يتم العثور على جداول',
            no_fields_found: 'لم يتم العثور على حقول',
            create: 'إنشاء',
            cancel: 'إلغاء',
        },

        import_database_dialog: {
            title: 'استيراد إلى المخطط الحالي',
            override_alert: {
                title: 'استيراد قاعدة بيانات',
                content: {
                    alert: 'سيؤدي استيراد هذا المخطط إلى التأثير على الجداول والعلاقات الحالية.',
                    new_tables:
                        'جداول جديدة <bold>{{newTablesNumber}}</bold> سيتم إضافة',
                    new_relationships:
                        'علاقات جديدة <bold>{{newRelationshipsNumber}}</bold> سيتم إنشاء',
                    tables_override:
                        'جداول <bold>{{tablesOverrideNumber}}</bold> سيتم تعديل',
                    proceed: 'هل تريد المتابعة؟',
                },
                import: 'استيراد',
                cancel: 'إلغاء',
            },
        },

        export_image_dialog: {
            title: 'تصدير الصورة',
            description: ':اختر عامل المقياس للتصدير',
            scale_1x: '1x (جودة منخفضة)',
            scale_2x: '2x (جودة عادية)',
            scale_4x: '4x (أفضل جودة)',
            cancel: 'إلغاء',
            export: 'تصدير',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },

        new_table_schema_dialog: {
            title: 'اختر مخططاً',
            description:
                '.يتم حالياً عرض مخططات متعددة. اختر واحداً للجدول الجديد',
            cancel: 'إلغاء',
            confirm: 'تأكيد',
        },

        update_table_schema_dialog: {
            title: 'تغيير المخطط',
            description: '"{{tableName}}" تحديث مخطط الجدول',
            cancel: 'إلغاء',
            confirm: 'تغيير',
        },
        create_table_schema_dialog: {
            title: 'إنشاء مخطط جديد',
            description:
                'لا توجد مخططات حتى الآن. قم بإنشاء أول مخطط لتنظيم جداولك.',
            create: 'إنشاء',
            cancel: 'إلغاء',
        },

        star_us_dialog: {
            title: '!ساعدنا على التحسن',
            description: '؟! إنها مجرد نقرة واحدةGITHUB هل ترغب في تقييمنا على',
            close: 'ليس الآن',
            confirm: '!بالتأكيد',
        },
        export_diagram_dialog: {
            title: 'تصدير المخطط',
            description: ':اختر التنسيق للتصدير',
            format_json: 'JSON',
            cancel: 'إلغاء',
            export: 'تصدير',
            error: {
                title: 'حدث خطأ أثناء التصدير',
                description:
                    'support@schemadash.io حدث خطأ ما. هل تحتاج إلى مساعدة؟',
            },
        },
        import_diagram_dialog: {
            title: 'استيراد الرسم البياني',
            description: ':للرسم البياني ادناه JSON قم بلصق',
            cancel: 'إلغاء',
            import: 'استيراد',
            error: {
                title: 'حدث خطأ أثناء الاستيراد',
                description:
                    'support@schemadash.io و المحاولة مرة اخرى. هل تحتاج إلى المساعدة؟ JSON غير صالح. يرجى التحقق من JSON الرسم البياني',
            },
        },
        import_dbml_dialog: {
            // TODO: Translate
            title: 'Import DBML',
            example_title: 'Import Example DBML',
            description: 'Import a database schema from DBML format.',
            import: 'Import',
            cancel: 'Cancel',
            skip_and_empty: 'Skip & Empty',
            show_example: 'Show Example',
            error: {
                title: 'Error',
                description: 'Failed to parse DBML. Please check the syntax.',
            },
        },
        relationship_type: {
            one_to_one: 'واحد إلى واحد',
            one_to_many: 'واحد إلى متعدد',
            many_to_one: 'متعدد إلى واحد',
            many_to_many: 'متعدد إلى متعدد',
        },

        canvas_context_menu: {
            new_table: 'جدول جديد',
            new_view: 'عرض جديد',
            new_relationship: 'علاقة جديدة',
            // TODO: Translate
            new_area: 'منطقة جديدة',
            new_note: 'ملاحظة جديدة',
        },

        table_node_context_menu: {
            edit_table: 'تعديل الجدول',
            duplicate_table: 'نسخ الجدول',
            delete_table: 'حذف الجدول',
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        canvas: {
            all_tables_hidden: 'جميع الجداول مخفية',
            show_all_tables: 'عرض الكل',
        },

        canvas_filter: {
            title: 'تصفية الجداول',
            search_placeholder: 'البحث في الجداول...',
            group_by_schema: 'تجميع حسب المخطط',
            group_by_area: 'تجميع حسب المنطقة',
            no_tables_found: 'لم يتم العثور على جداول',
            empty_diagram_description: 'أنشئ جدولاً للبدء',
            no_tables_description: 'جرب تعديل البحث أو التصفية',
            clear_filter: 'مسح التصفية',
        },

        snap_to_grid_tooltip: '({{key}} مغنظة الشبكة (اضغط مع الاستمرار على',

        tool_tips: {
            double_click_to_edit: 'انقر مرتين للتعديل',
        },

        language_select: {
            change_language: 'اللغة',
        },
        on: 'تشغيل',
        off: 'إيقاف',
    },
};

export const arMetadata: LanguageMetadata = {
    name: 'Arabic',
    nativeName: 'العربية',
    code: 'ar',
};
