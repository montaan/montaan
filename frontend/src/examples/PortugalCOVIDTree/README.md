# PortugalCOVIDTree

The Portugal COVID-19 tree example showcases how to implement a simple custom filesystem and a pre-constructed tree. It visualizes the entire population of Portugal, with directories for the regional hierarchy and region population split into buckets of 150, and a file per person. If a region has N COVID-19 cases, the first N people in the region are colored red.

The example also generates a random infection graph, using an R of 3. When you click a case, the chain of infection is shown.
