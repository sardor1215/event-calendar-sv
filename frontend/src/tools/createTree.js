import * as d3 from "d3";

export const createTree = (svgRef, data) => {
  let i = 0;
  if (!data) return;

  const width = 800;
  const height = 1000;

  const svg = d3
    .select(svgRef.current)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(40, 40)");

  const treeLayout = d3.tree().size([width - 160, height - 200]);

  const root = d3.hierarchy(data, (d) => d.children);
  root.x0 = width / 2;
  root.y0 = 0;

  const update = (source) => {
    const nodes = root.descendants().reverse();
    const links = root.links();

    treeLayout(root);

    nodes.forEach((d) => {
      d.x = d.x;
      d.y = d.depth * 180;
    });

    // Nodes
    const node = svg
      .selectAll("g.node")
      .data(nodes, (d) => d.id || (d.id = ++i)); // Fixed: Ensure `i` is declared and used

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${source.x0},${source.y0})`)
      .on("click", (event, d) => {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      });

    // Append icons directly using D3 based on node type
    nodeEnter
      .append("foreignObject")
      .attr("width", 50)
      .attr("height", 50)
      .attr("x", -25)
      .attr("y", -50)
      .append("xhtml:div")
      .style("width", "50px")
      .style("height", "50px")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .html((d) => {
        if (d.data.name === "Sunvalley") {
          return `<svg viewBox="0 0 24 24" fill="currentColor" height="2em" width="2em"><path fill="none" d="M0 0h24v24H0z" /><path d="M9 19h3v-6.058L8 9.454l-4 3.488V19h3v-4h2v4zm12 2H3a1 1 0 01-1-1v-7.513a1 1 0 01.343-.754L6 8.544V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1zm-5-10v2h2v-2h-2zm0 4v2h2v-2h-2zm0-8v2h2V7h-2zm-4 0v2h2V7h-2z" /></svg>`;
        } else if (d.data.children) {
          return `<svg viewBox="0 0 640 512" fill="currentColor" height="2em" width="2em"><path d="M144 160c-44.2 0-80-35.8-80-80S99.8 0 144 0s80 35.8 80 80-35.8 80-80 80zm368 0c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7-1.3 7.2-1.9 14.7-1.9 22.3 0 38.2 16.8 72.5 43.3 96H21.3C9.6 320 0 310.4 0 298.7zM405.3 320h-.7c26.6-23.5 43.3-57.8 43.3-96 0-7.6-.7-15-1.9-22.3 13.6-6.3 28.7-9.7 44.6-9.7h42.7c58.9 0 106.7 47.8 106.7 106.7 0 11.8-9.6 21.3-21.3 21.3H405.3zm10.7-96c0 53-43 96-96 96s-96-43-96-96 43-96 96-96 96 43 96 96zM128 485.3c0-73.6 59.7-133.3 133.3-133.3h117.4c73.6 0 133.3 59.7 133.3 133.3 0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" /></svg>`;
        } else {
          return `<svg fill="currentColor" viewBox="0 0 16 16" height="2em" width="2em"><path d="M11 6a3 3 0 11-6 0 3 3 0 016 0z" /><path fillRule="evenodd" d="M0 8a8 8 0 1116 0A8 8 0 010 8zm8-7a7 7 0 00-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 008 1z" /></svg>`;
        }
      });

    // Add text for nodes
    nodeEnter
      .append("text")
      .attr("dy", "1.2em")
      .attr("x", 0)
      .attr("text-anchor", "middle")
      .text((d) => d.data.name)
      .style("fill-opacity", 1)
      .style("font-size", "14px")
      .style("font-family", "Arial, sans-serif")
      .style("font-weight", (d) => (d.data.children ? "bold" : "normal"))
      .style("fill", "#333");

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate
      .transition()
      .duration(300)
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    const nodeExit = node
      .exit()
      .transition()
      .duration(300)
      .attr("transform", (d) => `translate(${source.x},${source.y})`)
      .remove();

    nodeExit.select("text").style("fill-opacity", 1e-6);

    // Links
    const link = svg.selectAll("path.link").data(links, (d) => d.target.id);

    const linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    link
      .merge(linkEnter)
      .transition()
      .duration(300)
      .attr("d", (d) => diagonal(d))
      .attr("stroke", "#888");

    link
      .exit()
      .transition()
      .duration(300)
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    nodes.forEach((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  };

  const diagonal = (d) => {
    return `M${d.source.x},${d.source.y}
            L${d.source.x},${d.target.y}
            L${d.target.x},${d.target.y}`;
  };

  root.children.forEach((child) => {
    child._children = child.children;
    child.children = null;
  });

  update(root);
};
