---
title: Style Savant
emoji: ✨
colorFrom: gray
colorTo: yellow
sdk: docker
app_port: 7860
fullWidth: true
short_description: AI-powered Ghanaian fashion marketplace and virtual try-on.
---

# Style Savant

Style Savant is an AI-powered fashion marketplace with consumer, vendor, and
admin experiences. The Docker image runs the Next.js frontend, Express API,
and a seeded PostgreSQL demo database in one container.

## Free deployment

Deploy the repository as a free Render web service using `render.yaml`. Add
`JWT_SECRET`, `AGNES_AI`, and `GEMINI_API_KEY` as secret environment variables
when prompted.

## Demo accounts

### Vendor

- Email: `11111111@style-savant.com`
- Password: `password`

### Customer

- Email: `customer@example.com`
- Password: `password`

The embedded demo database is recreated whenever a free instance is replaced.
Attach an external PostgreSQL database before using this as a production
deployment.
