// Formal V3 visuals and business prototypes have separate sources.
module.exports = {
    "version": 10,
    "formalFile": "2AT0tm9mkFhes8T81YzA2L",
    "commerceFile": "t7g261XYs61EdvYzIZn5YL",
    "copies": [
        {
            "name": "Home default",
            "originalNodeId": "7590:5619",
            "nodeId": "266:15903",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "note": "Copied by owner. Create My Plan is blue in the copy and red in the original screenshot; not approved as an identical visual baseline."
        },
        {
            "name": "Home AI plan",
            "originalNodeId": "7591:7185",
            "nodeId": "266:16114",
            "fileKey": "t7g261XYs61EdvYzIZn5YL"
        },
        {
            "name": "Home schedule",
            "originalNodeId": "7618:8349",
            "nodeId": "266:16423",
            "fileKey": "t7g261XYs61EdvYzIZn5YL"
        },
        {
            "name": "Home course plan",
            "originalNodeId": "7618:8832",
            "nodeId": "266:16704",
            "fileKey": "t7g261XYs61EdvYzIZn5YL"
        }
    ],
    "components": [
        {
            "name": "SfSectionTitle",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7590:5769",
            "status": "context-read",
            "note": "Formal V3 20 / 28 title; font matching remains under review."
        },
        {
            "name": "SfButton",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "266:16113",
            "status": "extended-v3",
            "note": "Formal V3 full-width geometry. Web glass highlight and pressed states are completed using HIG; Alpha membership is not the visual reference."
        },
        {
            "name": "SfMenuRow",
            "url": "https://developer.apple.com/design/human-interface-guidelines/materials",
            "status": "hig-extension",
            "note": "V3 material language and iOS hit targets. Optional icon, accessory value and native href support the existing profile and Settings menus. Decorative icons never replace labels; disabled/static rows do not navigate."
        },
        {
            "name": "SfUsageMeter",
            "url": "https://developer.apple.com/design/human-interface-guidelines/progress-indicators",
            "status": "hig-extension",
            "note": "Remaining included quantity supplied by business data, separate from Credits."
        },
        {
            "name": "SfAiBall",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "266:43201",
            "status": "dynamic-extension",
            "note": "Owner-authorized animated extension. Neutral 04/06 and side-up poses 01/07 verified against original screenshots. One head orientation drives spherical eye and inner colour projections; glass cover remains still."
        },
        {
            "name": "SfHeader",
            "url": "https://developer.apple.com/design/human-interface-guidelines/toolbars",
            "status": "hig-extension",
            "note": "Transparent title area; glass belongs to individual navigation controls. Symmetric grid centers titles and allows long titles to expand above content."
        },
        {
            "name": "SfBottomNavigation",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "8776:14970",
            "status": "component-migration",
            "note": "Formal Home four-tab bar and independent AI entry. Original SVG dimensions and existing actions retained."
        },
        {
            "name": "SfCourseCard",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7590:5784",
            "status": "component-migration",
            "note": "Formal 327 by 245 hero slot; API title and imagery remain dynamic."
        },
        {
            "name": "SfPlanCard",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7590:6676",
            "status": "component-migration",
            "note": "Empty plan from default Home; stage and progress states from 7591:7185 and 7618:8832 are reference-only in the workbench."
        },
        {
            "name": "SfProgressCard",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7590:5632",
            "status": "component-migration",
            "note": "Formal 200 by 150 Workout and Body cards. Source charts remain reference data until a dashboard data contract exists."
        },
        {
            "name": "SfPhotoEmptyState",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7619:9306",
            "status": "component-migration",
            "note": "Original photo and mask in the 327 by 163 slot with the formal full-width action."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfAmbientBackdrop",
            "note": "Original V3 ambient SVG layers and transforms, reused by native pages."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfPageLayout",
            "note": "Shared scrolling content, transparent title header and fixed independent controls."
        },
        {
            "nodeId": "6741:1367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfRoundAction",
            "note": "Original 72px Workout / 48px Coach Go layers; content ID retained in actions."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfStageCard",
            "note": "Shared normal/paused stages with original marker SVG, source typography and geometry. Source Stage I / second segment inconsistency is confined to reference snapshots."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfDayStrip",
            "note": "Five-day preview with roving keyboard navigation. No training completion is written."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfCoachWorkoutCard",
            "note": "Source photo slot and compact paused copy; dynamic API identity/duration and validated actions. Reference messages never create saved coaching assets."
        },
        {
            "nodeId": "6741:1367",
            "status": "component-migration",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "name": "SfWorkoutCarousel",
            "note": "Source central 300x400 poster and exact SVG Go layers; catalogue content remains dynamic."
        },
        {
            "name": "SfChatGreeting",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "3602:11542",
            "status": "component-migration",
            "note": "Full text-only desktop context and screenshot read. Formal 24/32, weight 590 and original gradient; dynamic API name."
        },
        {
            "name": "SfMessageBubble",
            "status": "legacy-adapter",
            "note": "Existing chat structure and API text composed with V3 materials. Full formal chat page migration remains incomplete."
        },
        {
            "name": "SfMessageComposer",
            "status": "legacy-adapter",
            "note": "Existing chat input and original send asset, with reusable field and native submit. Formal 3602:11680 expanded-state screenshot inspected; assetful full context remains unavailable."
        },
        {
            "name": "SfInsightCard",
            "status": "legacy-adapter",
            "note": "Existing result child 9:1517 assets and structure, composed with SfCard/SfButton. Real saved report grows naturally; formal 3486:2169 full page is not yet migrated."
        },
        {
            "name": "SfIcon",
            "url": "https://developer.apple.com/design/human-interface-guidelines/sf-symbols",
            "status": "hig-extension",
            "note": "Existing icons are preserved. Owner-requested profile menu icons use eight exact local Lucide SVGs pinned in assets/icons/profile-menu/manifest.json, with original license retained. Decorative masks inherit semantic text colour. These are an extension, not Figma exports or Apple SF Symbols."
        },
        {
            "name": "SfSegmentedControl",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfSwitch",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfField",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfSearchField",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfSlider",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfChoice",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfBadge",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfCard",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfAvatar",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfStepper",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfSkeleton",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfFeedback",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfToast",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfSheet",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfDialog",
            "url": "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "status": "hig-extension",
            "note": "Existing shared control; missing states use documented Apple guidance and accessible web semantics. Interactive variants are maintained in the component workbench."
        },
        {
            "name": "SfUserToolbar",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7618:8349",
            "status": "component-migration",
            "note": "Avatar/leading feedback and independent fixed actions. Home check-in expands for 3 seconds per user requirement; Home actions stay visible. Margins are excluded from available width to keep Workout controls inside the frame."
        },
        {
            "name": "SfWorkoutRecommendation",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7618:8511",
            "status": "component-migration",
            "note": "Formal Home recommendation shared across all four source states. API course identity stays dynamic; reference snapshots are scoped to the workbench."
        },
        {
            "name": "SfPlanProgress",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7670:10957",
            "status": "component-migration",
            "note": "Original four stage quadrants or percentage ring layers, with intrinsic SVG sizes and exact rotation. Display only; source samples are not actual plan progress."
        }
    ],
    "pages": [
        {
            "name": "Home default",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7590:5619",
            "status": "component-migration",
            "note": "Four formal Home snapshots composed with exact local assets. Actual dashboard, active plans and training history still need business data contracts; complete visual acceptance remains open."
        },
        {
            "name": "Home AI plan",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7591:7185",
            "status": "component-migration",
            "note": "Full source state now composed in the interactive workbench with exact local assets. Personal plan/history data is not in the storefront API; actual account screens do not receive these reference snapshots."
        },
        {
            "name": "Home schedule",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7618:8349",
            "status": "component-migration",
            "note": "Full source state now composed in the interactive workbench with exact local assets. Personal plan/history data is not in the storefront API; actual account screens do not receive these reference snapshots."
        },
        {
            "name": "Home course plan",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "7618:8832",
            "status": "component-migration",
            "note": "Full source state now composed in the interactive workbench with exact local assets. Personal plan/history data is not in the storefront API; actual account screens do not receive these reference snapshots."
        },
        {
            "name": "Membership & Usage",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "249:2183",
            "status": "redesigned-from-prototype"
        },
        {
            "name": "Personal center",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "249:2123",
            "status": "redesigned-from-prototype",
            "note": "Existing primary groups now reach secondary lists. Labels and original-item mappings live in app/profile-menu.js; complete Settings and Preferences use formal 6977:11258 / 6977:11115 screenshots, without mixing Home's alternate footer. Services without APIs retain explicit unavailable state; no invented menu entries."
        },
        {
            "nodeId": "6741:1367",
            "status": "component-migration",
            "name": "Workout Course",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "note": "Course mode migrated. World Tour and Free Mode remain unexpanded."
        },
        {
            "nodeId": "7652:9367",
            "status": "component-migration",
            "name": "Plan Training Day",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "note": "Interactive five-day preview and original adjustment context. Stage, goal and dates are reference data until a plan data contract exists."
        },
        {
            "nodeId": "6006:28045",
            "status": "extended-v3",
            "name": "Course detail",
            "fileKey": "Q2YjFPNeavj0zS6pHpr5Lk",
            "note": "Legacy information structure and assets composed with V3 controls. Formal V3 course detail not found. Preferences are scoped local Demo state."
        },
        {
            "name": "AI Coach",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "3602:11443",
            "status": "partial-component-migration",
            "note": "Formal greeting plus shared message/composer. Header and background retain existing restored page; formal four independent toolbar actions and microphone require full resource context."
        },
        {
            "name": "Workout Data",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "nodeId": "3486:2169",
            "status": "partial-component-migration",
            "note": "Shared saved Insight card and natural content flow. Summary, chart, course and RPE remain reference fixtures; formal full context asset reads denied or timed out."
        },
        {
            "name": "Plan Recovery Day",
            "nodeId": "7652:7214",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "status": "component-migration",
            "note": "Exact local assets and complete source snapshot in workbench. Plan state is reference-only; no training record or pause/resume API is called."
        },
        {
            "name": "Plan Completed",
            "nodeId": "7639:6783",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "status": "component-migration",
            "note": "Exact local assets and complete source snapshot in workbench. Plan state is reference-only; no training record or pause/resume API is called."
        },
        {
            "name": "Plan Paused",
            "nodeId": "4281:6716",
            "fileKey": "2AT0tm9mkFhes8T81YzA2L",
            "status": "component-migration",
            "note": "Exact local assets and complete source snapshot in workbench. Plan state is reference-only; no training record or pause/resume API is called. Cached toolbar export shows Close while the current screenshot shows More; existing shared More control retains original action semantics until a fresh vector context is available."
        },
        {
            "name": "Plans",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": null,
            "status": "extended-v3",
            "note": "Existing commerce business structure with shared V3 cards/buttons/feedback. Live storefront data and original confirmation flows; no matching formal V3 page is claimed."
        },
        {
            "name": "Billing History",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": null,
            "status": "extended-v3",
            "note": "Existing commerce business structure with shared V3 cards/buttons/feedback. Live storefront data and original confirmation flows; no matching formal V3 page is claimed."
        },
        {
            "name": "Credits wallet",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": null,
            "status": "extended-v3",
            "note": "Existing commerce business structure with shared V3 cards/buttons/feedback. Live storefront data and original confirmation flows; no matching formal V3 page is claimed."
        }
    ],
    "prototypeReferences": [
        {
            "name": "Membership & Usage business structure",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "249:2183",
            "status": "business-only"
        },
        {
            "name": "Personal center business structure",
            "fileKey": "t7g261XYs61EdvYzIZn5YL",
            "nodeId": "249:2123",
            "status": "business-only"
        }
    ]
}
