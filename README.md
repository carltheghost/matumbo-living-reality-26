# maTumbo Living Reality .26 — Reality Lattice Ω

Reality .26 is the clean experimental successor to .25.

## Core change from .25

.25 made the reality graph the primary object: a fixed 18-direction field around a nucleus.

.26 reverses that relationship:

**Reality is a programmable world. The graph describes relationships between worlds.**

The runtime is:

    PhysicsRuleSet
         ↓
    RealityState
         ↓
    RealityLatticeEngine
         ↓
    RealityProjection
         ↓
    Three.js

## Worlds included at boot

- Observed Reality
- Quantum Possibility
- CPT / Mirror
- Antimatter Reality
- Alternate History
- Research Frontier
- Higher-Dimensional World
- Custom Law Laboratory

Category/status metadata distinguishes grounded physics inspiration from theoretical, active-research, speculative, and purely invented software models. The engine does not block a model because it is speculative.

## Core operations

    forkReality()
    mergeReality()
    mirrorReality()
    invertMatter()
    transformReality()
    advanceTime()
    rewindSimulation()
    observeReality()
    traceLineage()
    compareReality()

Transformations create new world states and retain parent/lineage metadata. Reality history therefore remains queryable instead of silently overwriting the source world.

## Browser

Open index.html from GitHub Pages or another static server.

Three.js is pinned to 0.179.1 in the import map. The browser imports the bare specifier three; it does not append cache-busting query strings to the module specifier.

## Commands

    FORK R-OBSERVED
    MIRROR R-OBSERVED
    ANTI R-OBSERVED
    REWIND R-OBSERVED 5
    OBSERVE R-QUANTUM
    TRACE observer-1
    COMPARE R-OBSERVED R-MIRROR
    MERGE R-A R-B
    TRANSFORM R-OBSERVED custom-laws
    ADVANCE R-OBSERVED 1

## Tests

    npm test

The Node test suite exercises world creation, provenance categories, fork lineage, mirror/anti transforms, custom/research rules, rewind, merge, time direction, and higher-dimensional representation.

## Design rule

> Physics supplies the vocabulary and constraints. The software supplies the world.
