module.exports = {
  reviewedAt:'2026-10-13',
  policy:'Formal V3 visuals take precedence. Alpha membership is a business prototype, not a visual baseline. Missing states and controls use Apple guidance, translated to accessible web semantics.',
  references:[
    {title:'Apple Materials',url:'https://developer.apple.com/design/human-interface-guidelines/materials',application:'Glass is used for controls and navigation; opaque content surfaces remain readable.'},
    {title:'Apple Toolbars',url:'https://developer.apple.com/design/human-interface-guidelines/toolbars',application:'Navigation and actions have distinct controls. The title has no enclosing glass capsule; shared backgrounds are reserved for a related group of actions.'},
    {title:'Apple UI Design Dos and Don’ts',url:'https://developer.apple.com/design/tips/',application:'44-point touch targets, readable text, undistorted assets, no horizontal content overflow.'},
    {title:'Apple Sheets',url:'https://developer.apple.com/design/human-interface-guidelines/sheets',application:'One scoped modal task, explicit cancellation, return to parent, swipe and detent behavior.'},
    {title:'Apple Accessibility',url:'https://developer.apple.com/design/human-interface-guidelines/accessibility',application:'Reduced motion, increased contrast, transparency fallback and scalable text.'}
  ],
  additions:[
    {name:'SfSegmentedControl',basis:'V3 pill structure + Apple guidance for missing keyboard, disabled and overflow states'},
    {name:'SfHeader',basis:'Existing navigation hierarchy, transparent title region, separate glass controls and 44 px interactive areas'},
    {name:'SfSwitch',basis:'Apple toggle convention; web role=switch and explicit labels'},
    {name:'SfField',basis:'Persistent labels, help, error and password visibility'},
    {name:'SfSearchField',basis:'Search and clear without erasing unrelated form state'},
    {name:'SfSlider',basis:'Native range semantics, labelled values and keyboard behavior'},
    {name:'SfChoice',basis:'Native checkbox/radio groups, labelled hit areas'},
    {name:'SfSheet',basis:'Single modal, focus containment, cancellation, resize handle and guarded dismissal'},
    {name:'SfDialog',basis:'Explicit choice; destructive actions do not become the default'},
    {name:'SfFeedback',basis:'Inline success, error, empty and loading states'},
    {name:'SfCard',basis:'Reusable content surface with density and semantic tone'},
    {name:'SfBadge',basis:'Textual state in addition to colour'},
    {name:'SfAvatar',basis:'Dynamic image and accessible identity fallback for data-supplied imagery'},
    {name:'SfStepper',basis:'Labelled quantity bounds and keyboard interaction'},
    {name:'SfSkeleton',basis:'Layout-preserving loading, with reduced-motion support'},
    {name:'SfToast',basis:'Non-blocking status, explicit dismissal and paused timeout on interaction'},
    {name:'SfAiBall',basis:'Owner-authorized motion extension: inset colour face under a transparent glass cover, eyes above glass, shared face motion and independent blink. System-reduced motion defaults to still; explicit Demo preview can opt in.'}
  ]
}
