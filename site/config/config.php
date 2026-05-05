<?php

return [
    'debug'  => true,
    'thumbs' => [
        'srcsets' => [
            'default' => [
                '300w'  => ['width' => 300, 'quality' => 80],
                '600w'  => ['width' => 600, 'quality' => 80],
                '900w'  => ['width' => 900, 'quality' => 80],
                '1200w' => ['width' => 1200, 'quality' => 90],
                '1500w' => ['width' => 1500, 'quality' => 90]
            ],
            'webp' => [
                '300w'  => ['width' => 300, 'quality' => 80, 'format' => 'webp'],
                '600w'  => ['width' => 600, 'quality' => 80, 'format' => 'webp'],
                '900w'  => ['width' => 900, 'quality' => 80, 'format' => 'webp'],
                '1200w' => ['width' => 1200, 'quality' => 90, 'format' => 'webp'],
                '1500w' => ['width' => 1500, 'quality' => 90, 'format' => 'webp']
            ]
        ]
    ],
    'routes' => [
        [
            'pattern' => '(:all)',
            'action' => function($slug) {
                // Define slugs that should be handled by JavaScript instead of Kirby pages
                $jsHandledSlugs = ['about', 'calendar', 'imprint'];
                
                // Check if this slug should be handled by JavaScript
                $pathSegments = explode('/', $slug);
                $firstSegment = $pathSegments[0];
                
                if (in_array($firstSegment, $jsHandledSlugs)) {
                    // Serve homepage for JavaScript-handled routes
                    return page('home') ?: site()->homePage();
                }
                
                // Check if this is a valid Kirby page
                if ($page = page($slug)) {
                    return $page;
                }
                
                // For any other URL, serve the homepage
                // JavaScript will handle the URL parsing and state management
                return page('home') ?: site()->homePage();
            }
        ]
    ]
];