# Photo Gallery Website — Requirements Specification

## Overview

A simple, elegant photo gallery hosted on GitHub Pages at **soup.pics** that displays images in a randomized masonry layout with a fullscreen lightbox viewer.

## Functional Requirements

### Gallery Display

- **Layout**: Masonry-style grid that preserves image aspect ratios
- **Randomization**: Image order is randomized on every page load
- **Thumbnail Size**: Medium (~250px width)
- **Responsive Columns**: Auto-fit based on viewport width (fluid, no fixed breakpoints)
- **Background**: Dark gray or black
- **Header**: None — photos begin at top of page

### Image Loading

- **Strategy**: Lazy loading — images load as they scroll into view
- **Transitions**: Subtle fade-in effect as images load
- **Source Folder**: `/images` directory in repository root
- **Supported Formats**: JPG, PNG (primary); no artificial restrictions on other web-safe formats

### Lightbox Viewer

- **Activation**: Click/tap any thumbnail to open fullscreen view
- **Background**: Solid black
- **Navigation**:
    - Left/right arrow buttons (visible on screen, with dark circular backgrounds)
    - Swipe gestures (touch devices)
    - Keyboard arrow keys
- **Image Counter**: Simple "3 / 24" format displayed at bottom center of lightbox
- **Close Method**: X button in corner
- **Transitions**: Smooth fade for open/close
- **Preloading**: Adjacent images (previous/next) preload in background for faster browsing

### Soup of the Day

- **URL**: `/today`
- **Feature**: Displays a single randomly selected photo
- **Randomization**: Seeded by today's date — same photo for all visitors on the same day
- **Title**: "Soup of the Day" with trophy emojis, using Fredoka One font
- **Styling**: Centered layout, warm orange text (#e8a045) on black background

### Navigation

- **Gallery → Today**: Trophy button (🏆) in top-right corner of gallery links to `/today`
- **Today → Gallery**: Home button (🏠) in top-right corner of today page links back to `/`
- **Button Style**: Circular, semi-transparent dark background, brightens on hover

## Technical Requirements

### Hosting & Deployment

- **Platform**: GitHub Pages
- **Custom Domain**: soup.pics

### Domain Configuration

1. **CNAME File**: Repository must include a `CNAME` file in root containing:
   ```
   soup.pics
   ```

2. **DNS Records** (configure at domain registrar):

   | Type | Host | Value |
   |------|------|-------|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |

   *Or alternatively, if using www subdomain:*

   | Type | Host | Value |
         |------|------|-------|
   | CNAME | www | `<username>.github.io` |

3. **GitHub Settings**:
    - Navigate to repository → Settings → Pages
    - Enter `soup.pics` in Custom domain field
    - Enable "Enforce HTTPS" (after DNS propagates)

### Repository Structure:

  ```
  /
  ├── index.html
  ├── CNAME
  ├── README.md
  ├── css/
  │   ├── styles.css
  │   └── today.css
  ├── js/
  │   ├── gallery.js
  │   └── today.js
  ├── today/
  │   └── index.html
  ├── scripts/
  │   └── generate-manifest.js
  ├── images/
  │   └── (photo files)
  ├── data/
  │   └── images.json
  └── .github/
      └── workflows/
          └── build-gallery.yml
  ```

### Build Process

- **Image Discovery**: Automated via GitHub Actions
- **Trigger**: Runs on push to main branch
- **Function**: Scans `/images` folder and generates `images.json` file listing all image filenames
- **Output**: JSON array of image paths for the frontend to consume

### Dependencies (Minimal Libraries)

- **Masonry Layout**: Lightweight masonry library (e.g., Masonry.js, colcade, or similar)
- **Lightbox**: Lightweight lightbox library with touch support (e.g., GLightbox, lightGallery, or similar)
- **No frameworks**: Pure HTML/CSS/JS with targeted library use only

### Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome for Android)

## Non-Functional Requirements

### Performance

- Initial page load should be fast due to lazy loading
- Lightbox image transitions should feel snappy with preloading
- No unnecessary network requests

### Accessibility

- Keyboard navigation support in lightbox
- Semantic HTML structure
- Sufficient color contrast for UI elements

### Maintainability

- Adding new photos requires only adding files to `/images` folder
- GitHub Actions automatically updates the image list on push
- No manual JSON editing required

## User Workflow

### Gallery
1. User visits soup.pics
2. Masonry grid displays with randomized image order
3. Images lazy-load as user scrolls
4. User clicks a thumbnail → lightbox opens
5. User navigates with arrows, swipe, or keyboard
6. User clicks X button to close lightbox
7. On page refresh, images appear in new random order

### Soup of the Day
1. User clicks trophy button (🏆) or visits soup.pics/today
2. Single daily photo displays with "Soup of the Day" title
3. Same photo shown to all visitors that day
4. User clicks home button (🏠) to return to gallery

## Content Management Workflow

1. Developer adds new image(s) to `/images` folder
2. Developer commits and pushes to main branch
3. GitHub Actions workflow runs automatically
4. Workflow scans `/images` and updates `images.json`
5. Updated site is deployed to GitHub Pages
6. New images appear in gallery on next visit
