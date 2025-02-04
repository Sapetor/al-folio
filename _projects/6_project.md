---
layout: page
title: PL-TOON Platform
description: A Low-Cost Experimental Platform for Vehicle Formation Control
img: assets/img/pl-toon/platform.jpg
importance: 1
category: platforms
---

PL-TOON (Programmable Low-cost Train platOON) is an innovative experimental platform designed for research and education in vehicle formation control and platooning.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pl-toon/overview.jpg" title="PL-TOON Platform Overview" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pl-toon/vehicles.jpg" title="Autonomous Vehicles" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/pl-toon/control.jpg" title="Control Interface" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Left: The complete PL-TOON experimental setup. Middle: Individual autonomous vehicles in formation. Right: Real-time control and monitoring interface.
</div>

## Key Features

The platform provides a cost-effective solution for validating theoretical results in formation control, string stability, and multi-agent systems. It combines hardware and software components to create a flexible research environment.

<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/pl-toon/demo.jpg" title="Platform Demo" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/pl-toon/architecture.jpg" title="System Architecture" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Left: Platform demonstration during an experiment. Right: System architecture diagram showing the communication and control structure.
</div>

### Hardware Components

- Custom-designed chassis and track system
- ESP32-based control units
- Infrared sensors for position detection
- Wireless communication modules
- DC motors with encoders

### Software Architecture

- Arduino-compatible firmware
- Python-based control interface
- Real-time data visualization
- Open-source codebase

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/pl-toon/results.jpg" title="Experimental Results" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Sample experimental results showing vehicle formation performance and string stability analysis.
</div>

## Research Applications

The platform has been successfully used in various research projects:

1. **String Stability Analysis**

   - Validation of theoretical stability conditions
   - Testing of different communication protocols
   - Performance evaluation under delays

2. **Formation Control**
   - Implementation of various control strategies
   - Testing of adaptive algorithms
   - Validation of theoretical results

<div class="row">
    <div class="col-12 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/pl-toon/applications.jpg" title="Research Applications" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Different research applications of the PL-TOON platform, from basic formation control to complex multi-vehicle coordination.
</div>

## Resources and Documentation

All platform resources are open-source and available through our [GitHub repository](https://github.com/pl-toon/pl-toon-codes). This includes:

- Technical documentation
- Setup guides
- Example code
- Research data
- Educational materials

For more information about getting involved with the project, contact [andres.peters@uai.cl](mailto:andres.peters@uai.cl).
