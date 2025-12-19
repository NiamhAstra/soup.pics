# soup.pics

A cozy little photo gallery for our cat, Soup.

**[Visit soup.pics](https://soup.pics)**

## What is this?

This is a simple, fun website to share photos of Soup (the cat, not the food). I made it as a winter solstice present for my wife... just a cute way to show off one of our two 
furry family members.

It's not meant to be anything fancy, just a one-day project thrown together with love.

## Features

- **Masonry gallery** - Photos arranged in a nice flowing grid
- **Lightbox viewer** - Click any photo to view it full-size
- **Soup of the Day** - Visit `/today` for a daily random photo of Soup (same photo for everyone each day!)
- **Responsive** - Looks good on phones and desktops

## Tech Stack

Nothing fancy:
- Vanilla HTML/CSS/JavaScript
- [Masonry.js](https://masonry.desandro.com/) for the grid layout
- [GLightbox](https://biati-digital.github.io/glightbox/) for the lightbox
- GitHub Pages for hosting

## Adding Photos

Push images into the `images/` folder and let the CI workflow handle updating the data fileadd.

## Local Development

Just serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

---

Made with love for my wife, and for Soup.
