# Quick Commerce Checkout PRD

## Background
Quick Commerce needs a small checkout smoke flow for a mobile-first web page. Users should be able to sign in, review a cart with one item, and submit an order.

## Goals
- Validate that a registered user can sign in with email and password.
- Validate that the checkout page displays cart item, price, delivery address, and submit order button.
- Validate that submitting an order returns a confirmation number.

## User Story
As a returning customer, I want to sign in and submit my cart so that I can complete a purchase quickly.

## Functional Requirements
- The login form requires email and password.
- Invalid credentials show an inline error message without clearing the email field.
- Successful login redirects to `/checkout`.
- Checkout displays cart summary, delivery address, payment method, and total amount.
- Submit order calls `POST /orders` and shows an order confirmation state.

## Acceptance Criteria
- Given valid credentials, when the user signs in, then the checkout page is shown.
- Given a cart with one item, when the user opens checkout, then item name, quantity, and total are visible.
- Given checkout data is valid, when the user submits the order, then an order number is displayed.
- Given the order API returns an error, when the user submits the order, then a retryable error message is displayed.

## Out of Scope
- Coupon calculation.
- Guest checkout.
- Refunds and after-sales flows.
