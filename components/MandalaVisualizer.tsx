import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MandalaConfig } from '../types';

interface Props {
  config: MandalaConfig;
}

export const MandalaVisualizer: React.FC<Props> = ({ config }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !groupRef.current) return;

    const svg = d3.select(svgRef.current);
    const group = d3.select(groupRef.current);
    
    // Clear previous
    group.selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Maximizing size to fill the screen more (0.55 means slightly larger than the smallest dimension, creating an immersive feel)
    const maxRadius = Math.min(width, height) * 0.55;

    // Data generation for layers
    const layers = d3.range(config.layerCount);
    const colorScale = d3.scaleQuantize<string>()
      .domain([0, config.layerCount])
      .range(config.colors);

    // Draw layers
    layers.forEach((layerIndex) => {
      const radius = (maxRadius / config.layerCount) * (layerIndex + 1);
      const points = (layerIndex + 2) * (config.complexity > 5 ? 2 : 1) + 4; // More points for outer layers
      const angleStep = (Math.PI * 2) / points;

      const layerGroup = group.append("g")
        .attr("class", `layer-${layerIndex}`);

      // Generate shape path based on type
      const pathGenerator = d3.lineRadial<{angle: number, r: number}>()
        .angle(d => d.angle)
        .radius(d => d.r)
        .curve(d3.curveLinearClosed); // Default

      // Modify curve based on shape type
      if (config.shapeType === 'petal' || config.shapeType === 'circle') {
         pathGenerator.curve(d3.curveCatmullRomClosed.alpha(0.5));
      } else if (config.shapeType === 'square') {
         pathGenerator.curve(d3.curveStep);
      }

      const shapeData = [];
      for (let i = 0; i < points; i++) {
        const angle = i * angleStep;
        // Modulate radius for patterns
        const rOutput = config.shapeType === 'circle' 
          ? radius 
          : radius * (0.8 + (0.2 * Math.cos(angle * config.complexity)));
        
        shapeData.push({ angle, r: rOutput });
      }

      // Boost visibility with much thicker strokes and higher opacity
      const boostedStrokeWidth = config.strokeWidth * 2.5;

      layerGroup.append("path")
        .datum(shapeData)
        .attr("d", pathGenerator)
        .attr("fill", "none")
        .attr("stroke", colorScale(layerIndex))
        .attr("stroke-width", boostedStrokeWidth)
        .attr("stroke-opacity", 1.0) // Fully opaque lines
        .attr("fill", colorScale(layerIndex))
        .attr("fill-opacity", 0.35); // Increased fill visibility
    });

    // Animation
    let t = 0;
    const timer = d3.timer((elapsed) => {
      t = elapsed * 0.0005 * config.rotationSpeed;
      
      // Rotate entire group
      group.attr("transform", `translate(${width/2}, ${height/2}) rotate(${t})`);
      
      // Pulse effect based on stroke width
      group.selectAll("path")
        .attr("stroke-width", (d, i, nodes) => {
           const base = config.strokeWidth * 2.5;
           return base + Math.sin(elapsed * 0.003 + i) * 2.0;
        });
    });

    return () => {
      timer.stop();
    };
  }, [config]);

  return (
    <svg 
      ref={svgRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.8))' }} // Stronger shadow for better contrast against camera
    >
      <g ref={groupRef} />
    </svg>
  );
};