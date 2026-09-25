# Melanie, Out of Office website

## What's in here
- `index.html`: the whole page
- `media/`: photos and videos
- `netlify/functions/dispatches.mjs`: fetches the newest Substack posts for the Recent Dispatches section
- `netlify.toml`: tells Netlify where everything is

## How the live dispatches work
The page asks `/api/dispatches` for your 6 newest Substack posts and builds the cards from them:
- Photo: the post's header/cover image
- Blurb: the post's subtitle (or its opening lines if there's no subtitle)
- Date: when you published

New posts show up on the site within about 15 minutes of publishing.
If Substack is ever unreachable, the page quietly shows the cards built into index.html instead.

## Adding a location tag to a new post
Open index.html, search for `DISPATCH_PLACES`, and add a line like:

    { match: 'lisbon', place: 'Lisbon, Portugal', country: 'Portugal' },

`match` is any word that appears in the post's title or web address.
Posts without a match still appear; they just show the date and "Read on Substack."
