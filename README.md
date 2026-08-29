# What Should I Cook Tonight?

A budget-aware meal decision engine that answers a practical question: **what can I cook tonight with the ingredients, money, and people I have?**

## MVP

- Enter number of people
- Enter budget in local currency
- Enter ingredients already available
- Rank recipes by ingredient match and budget fit
- Show ingredients already available
- Show missing ingredients
- Estimate recipe cost and cost per person
- Provide recipe details and preparation time
- Mobile-first consumer experience

## Product principle

This is not a recipe search engine. The core product is a **meal decision engine** that reduces the work between "what do I have?" and "what should I cook?".

## Roadmap

1. MVP recommendation engine
2. Ingredient normalization and better matching
3. Local currency and regional pricing
4. Grocery/product links
5. Shopping lists
6. Weekly meal plans
7. Budget meal plans
8. Nutrition tracking
9. Affiliate and sponsored product integrations

## Development

The project is intentionally designed around free/open data sources and free-tier infrastructure where practical. Production integrations will be added behind provider adapters so the recommendation engine is not tightly coupled to a single API.

## Deployment

GitHub Actions will validate and build the application on every push. Deployment will be connected to a free-tier hosting provider so each approved change can be tested from a live URL.
