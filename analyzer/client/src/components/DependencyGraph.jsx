import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const DependencyGraph = ({ dependencies }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!dependencies || dependencies.length === 0 || !svgRef.current || !containerRef.current) {
      return;
    }
    
    // Crea un mapping di nomi file per identificare correttamente i nodi del progetto
    const projectFiles = new Set();
    dependencies.forEach(dep => {
      if (dep.packageName && dep.fileName) {
        const fullName = `${dep.packageName}.${dep.fileName.replace('.java', '')}`;
        projectFiles.add(fullName);
      }
    });
    
    // Prepara i dati per il grafo
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Aggiungi nodi e collegamenti
    dependencies.forEach(dep => {
      const sourceId = `${dep.packageName}.${dep.fileName.replace('.java', '')}`;
      
      // Aggiungi nodo sorgente
      if (!nodeMap.has(sourceId)) {
        const sourceNode = {
          id: sourceId,
          name: dep.fileName.replace('.java', ''),
          package: dep.packageName,
          group: 1 // File del progetto
        };
        nodes.push(sourceNode);
        nodeMap.set(sourceId, sourceNode);
      }
      
      // Aggiungi nodi per le dipendenze
      (dep.dependencies || []).forEach(targetDep => {
        if (!targetDep) return;
        
        const parts = targetDep.split('.');
        const targetName = parts[parts.length - 1];
        const targetPackage = parts.slice(0, -1).join('.');
        
        // Verifica se questa dipendenza è anche un file del progetto
        const isProjectFile = projectFiles.has(targetDep);
        
        if (!nodeMap.has(targetDep)) {
          const targetNode = {
            id: targetDep,
            name: targetName,
            package: targetPackage,
            group: isProjectFile ? 1 : 2 // Usa gruppo 1 se è un file del progetto
          };
          nodes.push(targetNode);
          nodeMap.set(targetDep, targetNode);
        } else if (isProjectFile) {
          // Se è già nella mappa ma è un file del progetto, aggiorna il gruppo
          nodeMap.get(targetDep).group = 1;
        }
        
        // Aggiungi collegamento
        links.push({
          source: sourceId,
          target: targetDep,
          value: 1
        });
      });
    });
    
    console.log("Nodi generati:", nodes.length);
    console.log("Link generati:", links.length);
    
    // Calcola dimensione del contenitore
    const width = containerRef.current.clientWidth;
    const height = 600;
    
    // Pulisci SVG esistente
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Crea SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
      
    // Crea gruppo per zoom/pan
    const g = svg.append('g');
    
    // Aggiungi zoom
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      }));
      
    // Crea simulazione fisica
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));
    
    // Funzioni per drag dei nodi
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Crea collegamenti
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));
      
    // Crea nodi
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
        
    // Aggiungi cerchi ai nodi
    node.append('circle')
      .attr('r', 5)
      .attr('fill', d => d.group === 1 ? '#FF6B6B' : '#4ECDC4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
      
    // Aggiungi etichette
    node.append('text')
      .attr('x', 8)
      .attr('y', '0.31em')
      .text(d => d.name)
      .style('font-family', 'Arial')
      .style('font-size', 10);
      
    // Aggiungi tooltip
    node.append('title')
      .text(d => `${d.id}\nPackage: ${d.package}\nTipo: ${d.group === 1 ? 'File del progetto' : 'Dipendenza'}`);
      
    // Aggiorna posizioni ad ogni tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
        
      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    return () => {
      simulation.stop();
    };
  }, [dependencies]);
  
  return (
    <div className="graph-container" ref={containerRef}>
      <h2>Grafo delle Dipendenze</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DependencyGraph;