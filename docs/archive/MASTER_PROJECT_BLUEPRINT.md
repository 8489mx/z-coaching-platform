# Z Coaching Platform - Master Project Blueprint

## Purpose

This document is the single source of truth for continuing the project after context loss. It describes the product vision, architecture decisions, completed work, and remaining roadmap.

## Product Vision

Z Coaching Platform is an evidence-based coaching operating system, not only a workout generator.

The platform consists of:

- Client mobile application (Android + iOS)
- Coach/Admin dashboard
- Fixed-rule coaching engines for Training, Nutrition, Cardio, Mobility and Progress Tracking
- AI assistant layer for productivity and communication support

## Core Architecture Decision

The AI layer is NOT the decision maker.

The real intelligence of the system is deterministic code-based domain engines.

Reason:

- Health and fitness decisions must be reproducible.
- The same client state must always produce predictable outputs.
- AI hallucination or inconsistency must not affect training or nutrition decisions.

Architecture:

Client Data
    -> Safety Engine
    -> Rules Engine
    -> Training/Nutrition/Cardio/Mobility Engines
    -> Validation Engine
    -> Coach Approval
    -> Client Application

AI Assistant Layer exists above this system.

## AI Role

AI providers (ChatGPT/Gemini or future providers) are used only as assistants.

Allowed examples:

- Summarize client progress.
- Explain plans to clients.
- Help coaches find important changes.
- Answer general questions using approved system data.
- Convert technical outputs into human-friendly language.

Not allowed:

- Generating uncontrolled workout plans.
- Making medical decisions.
- Changing nutrition rules.
- Overriding domain engines.

## Current Development Philosophy

Every important decision should exist as:

- Rule
- Reason
- Constraints
- Exceptions
- Scientific reference
- Tests

## Development Roadmap

### Phase 1 - Domain Foundation (Current)

Status: In progress

Completed:

- Domain-first architecture.
- Intake decision logic.
- Safety checks.
- Training specifications.
- Training blueprints.
- Exercise selection logic.
- Prescription generation.
- Weekly scheduling.
- Validation/preflight concepts.

Remaining:

- Complete domain documentation.
- Add missing tests.
- Add nutrition engine.
- Add cardio engine.
- Add mobility engine.

### Phase 2 - Coaching Intelligence

Build:

- Nutrition Engine.
- Cardio Engine.
- Mobility/Flexibility Engine.
- Check-in Engine.
- Adaptation Engine.
- Progress analysis.
- Versioned plan history.

### Phase 3 - Platform Layer

Build:

- Database.
- Authentication.
- Client profiles.
- Coach dashboard.
- Client mobile apps.
- Notifications.
- Subscription system.

### Phase 4 - AI Assistant Layer

Integrate:

- ChatGPT/Gemini provider abstraction.
- Coach assistant.
- Client assistant.
- Natural language interface over approved system data.

## Important Rule

Never replace deterministic coaching logic with AI generation. AI assists the system; it does not become the system.
