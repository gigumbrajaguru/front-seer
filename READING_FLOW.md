# Frontend Reading Flow Documentation

This Angular app collects the question, selected oracle systems, spreads, and card picks. AI interpretation requests are made only after the user presses `Get Your Reading` and the app enters the results route.

## Main Files

- `src/app/features/reading/reading.component.ts`: Question, oracle selection, spread selection, card drawing, and route transition.
- `src/app/features/results/results.component.ts`: Calls the backend and renders the final summary plus per-oracle results.
- `src/app/core/services/reading.service.ts`: Shared session state for the current reading.
- `src/app/core/services/reading-api.service.ts`: HTTP client for spread suggestions and reading interpretation.
- `src/app/core/models/session.model.ts`: Request and response interfaces shared by the frontend.

## UI Flow

1. Question
   - User enters a question and optional context.
   - `Ask the Oracle` calls `suggestSpreads()`.

2. Oracle selection
   - User selects one or more oracle systems.
   - No interpretation request is made here.

3. Spread selection
   - User chooses a spread for each selected oracle.
   - No interpretation request is made here.

4. Card drawing
   - User selects cards for each oracle.
   - `Confirm <Oracle>` stores selected cards locally through `ReadingService`.
   - No interpretation request is made when confirming cards.

5. Results
   - `Get Your Reading` navigates to `/results`.
   - `ResultsComponent` makes interpretation requests.

## Backend Calls From Results

`ResultsComponent.fetchInterpretations()` starts the AI calls after navigation to `/results`.

It sends:

- One combined request through `submitFinalSummary()`.
- One per-oracle request through `submitReading()` for each selected oracle.

The combined request drives the top `Finalized Summary`. Per-oracle requests drive the individual oracle sections and card insights below it.

## Final Summary Behavior

The top summary prefers the combined backend response:

- `finalVerdict` or `final_verdict` becomes `Final verdict: ...`
- `finalized_answer` or `interpretation` becomes `Finalized answer: ...`

If the combined request fails but per-oracle responses succeed, the component can still fall back to joining those per-oracle final texts into one paragraph. The backend should normally provide the combined response, so the top summary should read as one answer for the whole reading.

## Per-Oracle Result Behavior

Each oracle section shows:

- Method-level question answer.
- Optional method summary list.
- Card-level pick interpretation when returned by the backend.
- Default local card meaning if the backend fails for that oracle.

## Important Rule

Do not add interpretation calls to `confirmSelection()`. That method should only store selected card state. AI calls belong in the results route after `Get Your Reading`.

## Verification

Build check:

```bash
npm run build
```

Development server:

```bash
npm start
```
