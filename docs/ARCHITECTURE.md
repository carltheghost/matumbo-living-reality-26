# Reality Lattice Ω — .26 Architecture

## Core model

Reality .25 treated the field graph as the primary model. .26 changes the ontology:

**Reality is a programmable world. The graph describes relationships between worlds.**

Pipeline:

    PhysicsRuleSet
         ↓
    RealityState
         ↓
    RealityLatticeEngine
         ↓
    RealityProjection
         ↓
    Three.js / future VR / AR

## RealityState

A world owns identity, lineage, law-set reference, dimensions, time, entropy, information, energy/momentum summaries, entities, causal graph, history and metadata.

## PhysicsRuleSet

A rule set contains constants, dimensions, interactions, conservation policy, causality, time model and observation behavior. Provenance is explicitly categorized A through E. Category does not block execution.

## Transformations

The engine exposes forkReality, mergeReality, mirrorReality, invertMatter, transformReality, advanceTime, rewindSimulation, observeReality, traceLineage and compareReality.

Transformations create new world states and preserve parent/lineage metadata. The graph therefore records where a world came from.

## Reality Conservation

Each entity carries a lineageId. Matter/antimatter conversion, mirrors, branches and rule-set transforms preserve that lineage identifier unless a future rule intentionally breaks it.

## Important semantic boundary

The implementation of a mirror/CPT world is a software mapping inspired by physics. It does not claim that a reachable antimatter universe or time-reversed universe exists.

The same applies to rewinding, merging realities, changing laws, arbitrary dimensions and custom worlds. They are computational constructs.

## Rendering

Three.js is only a projection. The engine is Node-testable without WebGL. The first browser surface is a world graph instead of the .25 fixed 18-direction field.

## Expansion points

Numerical integrators, relativistic state, quantum-state approximations, field solvers, spatial law domains, nested worlds, richer causal graphs, 4-D slicing and VR/AR interaction can be added without changing the core ontology.
