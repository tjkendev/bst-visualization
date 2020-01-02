"use strict";

function is_black(node) {
  return (node === null) || (node.color === 0);
}

function is_red(node) {
  return !is_black(node);
}

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++node_id_gen;
    // 0 = black, 1 = red
    this.color = 1;
  }

  remove_child(child) {
    if(child !== null) {
      if(this.left === child) {
        this.left = child.prt = null;
      }
      if(this.right === child) {
        this.right = child.prt = null;
      }
    }
  }

  remove_left() {
    const left = this.left;
    if(left !== null) {
      this.left = left.prt = null;
    }
    return left;
  }
  remove_right() {
    const right = this.right;
    if(right !== null) {
      this.right = right.prt = null;
    }
    return right;
  }

  set_left(node) {
    if(this.left !== null) {
      this.remove_child(this.left);
    }
    this.left = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
  }

  set_right(node) {
    if(this.right !== null) {
      this.remove_child(this.right);
    }
    this.right = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
  }

  rotate_left() {
    const r = this.right;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(r === null) {
      return null;
    }
    this.set_right(r.left);
    r.set_left(this);

    if(p !== null) {
      if(is_left) {
        p.set_left(r);
      } else {
        p.set_right(r);
      }
    }
    return r;
  }

  rotate_right() {
    const l = this.left;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(l === null) {
      return null;
    }
    this.set_left(l.right);
    l.set_right(this);

    if(p !== null) {
      if(is_left) {
        p.set_left(l);
      } else {
        p.set_right(l);
      }
    }
    return l;
  }

  is_left(node) {
    return this.left === node;
  }

  is_right(node) {
    return this.right === node;
  }

  get_sib(node) {
    return (this.is_left(node) ? this.right : this.left);
  }
}

class BottomUpRedBlackTree {
  constructor() {
    this.clear();
    this.update_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
    this.dnode_color = null;
  }

  insert(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      this.cur = this.root = new Node(x);
      return this.root;
    }

    let node = this.root;
    while(node.val !== x) {
      this.update_nodes.add(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }

    if(x === node.val) {
      return this.cur = null;
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    this.cur = new_node;
    return new_node;
  }

  remove(x) {
    this.update_nodes = new Set();
    this.cur = this.prt = null;
    this.dnode = null;
    let node = this.root;
    while(node !== null) {
      if(node.val === x) break;
      this.update_nodes.add(node);
      if(x < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    if(node === null) {
      return null;
    }

    const prt = node.prt;
    if(node.left === null || node.right === null) {
      const n_node = node.left || node.right;
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(n_node);
        } else {
          prt.set_right(n_node);
        }
        this.prt = prt;
        this.cur = n_node;
      } else {
        node.remove_child(n_node);
        this.root = n_node;
        this.cur = n_node;
      }
      this.dnode_color = node.color;
    } else if(node.left !== null && node.right !== null) {
      let c_node = node.right;
      while(c_node.left !== null) {
        this.update_nodes.add(c_node);
        c_node = c_node.left;
      }
      this.update_nodes.add(c_node);
      const c_prt = c_node.prt;
      let is_child = node.is_right(c_node);
      if(!is_child) {
        c_prt.set_left(c_node.right);
        c_node.set_right(node.right);
      }
      c_node.set_left(node.left);
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(c_node);
        } else {
          prt.set_right(c_node);
        }
      } else {
        node.remove_right();
        this.root = c_node;
      }
      if(is_child) {
        this.prt = c_node;
        this.cur = c_node.right;
      } else {
        this.prt = c_prt;
        this.cur = c_prt.left;
      }
      this.dnode_color = c_node.color;
      c_node.color = node.color;
    }
    return node;
  }

  *insert_rebalancing() {
    if(this.cur === null) {
      return;
    }
    let node = this.cur;
    while(true) {
      let prt = node.prt;
      if(prt === null) {
        if(node.color === 1) {
          node.color = 0;
          yield;
        }
        break;
      }
      if(prt.color === 0) {
        // do nothing
        break;
      }
      const gprt = prt.prt;
      // assert (prt.color === 1 && gprt !== null)
      const u = gprt.get_sib(prt);
      if(u === null || u.color === 0) {
        if(gprt.is_left(prt) && prt.is_right(node)) {
          prt = prt.rotate_left();
          node = prt.left;
          yield;
        } else if(gprt.is_right(prt) && prt.is_left(node)) {
          prt = prt.rotate_right();
          node = prt.right;
          yield;
        }

        if(prt.is_left(node)) {
          const r = gprt.rotate_right();
          if(r.prt === null) this.root = r;
        } else {
          const r = gprt.rotate_left();
          if(r.prt === null) this.root = r;
        }
        yield;

        prt.color = 0;
        gprt.color = 1;
        yield;

        break;
      }

      prt.color = 0;
      gprt.color = 1;
      u.color = 0;

      yield;
      node = gprt;
    }
  }

  *remove_rebalancing() {
    if(this.dnode_color === 1) {
      return;
    }
    if(is_red(this.cur)) {
      this.cur.color = 0;
      this.update_nodes.add(this.cur);
      yield;
      return;
    }

    let node = this.cur, prt = this.prt;
    while(true) {
      if(prt === null) {
        break;
      }
      let sib = prt.get_sib(node);
      this.update_nodes.add(sib);
      // assert (sib !== null)
      if(is_red(sib)) {
        const r = (prt.is_left(node) ? prt.rotate_left() : prt.rotate_right());
        if(r.prt === null) this.root = r;
        yield;

        prt.color = 1;
        sib.color = 0;

        sib = prt.get_sib(node);
        this.update_nodes.add(sib);
        yield;
      }

      if([prt, sib, sib.left, sib.right].some(is_red)) {
        if(is_red(prt) && [sib, sib.left, sib.right].every(is_black)) {
          sib.color = 1;
          prt.color = 0;
          yield;
          break;
        }

        if(is_black(sib)) {
          if(prt.is_left(node) && is_black(sib.right) && is_red(sib.left)) {
            const r = sib.rotate_right();
            yield;

            r.color = 1;
            r.right.color = 0;
            this.update_nodes.add(r.right);
          } else if(prt.is_right(node) && is_black(sib.left) && is_red(sib.right)) {
            const r = sib.rotate_left();
            yield;

            r.color = 1;
            r.left.color = 0;
            this.update_nodes.add(r.left);
          }
          sib = prt.get_sib(node);
          this.update_nodes.add(sib);
          yield;
        }

        if(prt.is_left(node)) {
          const r = prt.rotate_left();
          if(r.prt === null) this.root = r;
          yield;

          sib.color = prt.color;
          prt.color = sib.right.color = 0;
          this.update_nodes.add(sib.right);
          yield;
        } else {
          const r = prt.rotate_right();
          if(r.prt === null) this.root = r;
          yield;

          sib.color = prt.color;
          prt.color = sib.left.color = 0;
          this.update_nodes.add(sib.left);
          yield;
        }
        break;
      }

      sib.color = 1;
      yield;

      node = prt;
      prt = prt && prt.prt;
    }
  }

  get_update_nodes() {
    return this.update_nodes;
  }
}

const redblack_tree = new BottomUpRedBlackTree();

const node_view = {};
const node_map = {};
let tl = null;
const NODE_W = 20, NODE_H = 40;
const BASE_X = 35, BASE_Y = 15;

function translate_obj(result, tl) {
  tl.add({
    targets: ['g.node'],
    translateX: (el) => {
      const n_id = $(el).attr("nid");
      return result[n_id][0] * NODE_W + BASE_X;
    },
    translateY: (el) => {
      const n_id = $(el).attr("nid");
      return result[n_id][1] * NODE_H + BASE_Y;
    },
    duration: 1000,
    easing: 'linear',
  }).add({
    targets: ['circle.node-circle'],
    stroke: [{value: (el) => {
      const n_id = $(el).parent().attr("nid");
      const node = node_map[n_id];
      return (node.color === 1 ? "#ff0000" : "#000000");
    }}],
    offset: '-=1000',
    duration: 1000,
  }).add({
    targets: ['path.edge'],
    d: [{value: (el) => {
      const n_id = $(el).attr("nid");
      const node = node_map[n_id], f = result[n_id];
      const fx = f[0] * NODE_W + 10 + BASE_X, fy = f[1] * NODE_H + 10 + BASE_Y;

      const l_child = node.left, r_child = node.right;
      let l_tx = fx, l_ty = fy;
      if(l_child !== null) {
        const t = result[l_child.id];
        l_tx = t[0] * NODE_W + 10 + BASE_X;
        l_ty = t[1] * NODE_H + 10 + BASE_Y;
      }
      let r_tx = fx, r_ty = fy;
      if(r_child !== null) {
        const t = result[r_child.id];
        r_tx = t[0] * NODE_W + 10 + BASE_X;
        r_ty = t[1] * NODE_H + 10 + BASE_Y;
      }
      return `M${l_tx},${l_ty}L${fx},${fy}L${r_tx},${r_ty}`;
    }}],
    offset: '-=1000',
    duration: 1000,
    easing: 'linear',
  });
}

window.onload = () => {
  const canvas = $("svg.canvas");
  const nodes = canvas.find(".nodes");
  const edges = canvas.find(".edges");

  const add_node = (v, n_id) => {
    nodes.append(createNode(v, n_id));
    edges.append(createEdge(v, n_id));
    const node = $(`g.node${n_id}`);
    const edge = $(`path.edge${n_id}`);

    node_view[v] = {
      "node": node,
      "edge": edge,
    };
  };

  const change_canvas_size = (width, height) => {
    canvas.css({
      "width": `${width}px`,
      "height": `${height}px`,
    });
  };

  const remove_tree_node = (v) => {
    const tree = redblack_tree;
    const node_num = Object.keys(node_view).length;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      max_depth = result_m[1];
      translate_obj(result_m[0], tl);
    }

    const r = redblack_tree.remove(v);
    let v_n_id = null;
    let targetNode = null;
    if(r !== null) {
      v_n_id = r.id;
      targetNode = node_view[v].node;

      tl.add({
        targets: [`path.edge${v_n_id}`],
        opacity: 0,
        duration: 500,
        easing: 'linear',
      }).add({
        targets: [`g.node${v_n_id}`],
        opacity: 0,
        duration: 500,
        easing: 'linear',
      });

      let updated = true;
      const step = tree.remove_rebalancing();
      while(true) {
        const result_m = traverse(tree.root);
        const result = result_m[0];
        result[v_n_id] = [0, 0];
        max_depth = Math.max(max_depth, result_m[1]);
        translate_obj(result, tl);

        if(!updated) break;
        updated = !step.next().done;
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }
    const update_nodes = tree.get_update_nodes();

    if(targetNode !== null) {
      targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    }
    for(let node of update_nodes) {
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      if(targetNode !== null) {
        targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      }
      for(let node of update_nodes) {
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }

      if(v_n_id !== null) {
        // remove selected node
        removeNode(v_n_id);
        removeEdge(v_n_id);
      }
    };

    change_canvas_size(
      (node_num+5) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    const tree = redblack_tree;
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });


    tl.add({
      duration: 1000,
    });

    const r = tree.insert(v);
    if(r !== null) {
      const n_id = r.id;
      add_node(v, n_id);
      node_map[n_id] = r;
    }

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      max_depth = result_m[1];
      translate_obj(result_m[0], tl);
    }

    const step = tree.insert_rebalancing();

    while(!step.next().done) {
      const result_m = traverse(tree.root);

      max_depth = Math.max(max_depth, result_m[1]);

      translate_obj(result_m[0], tl);
    }

    const targetNode = node_view[v].node;

    const update_nodes = tree.get_update_nodes();
    targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    for(let node of update_nodes) {
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      for(let node of update_nodes) {
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }
    };

    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  $(".add-random").click((el) => {
    const v = Math.floor(Math.random()*1000);
    add_tree_node(v);
  });

  $(".remove-random").click((el) => {
    const vs = Object.keys(node_view);
    if(vs.length > 0) {
      const v = parseInt(vs[Math.floor(Math.random() * vs.length)]);
      remove_tree_node(v);
    }
  });

  const property_check = () => {
    let base_depth = -1;
    const leaves = [];

    const dfs = (node, prt, bdep) => {
      if(node === null) {
        if(prt) leaves.push([prt, bdep+1]);
        return;
      }
      if(node.color === 0) {
        ++bdep;
      }
      dfs(node.left, node, bdep);
      if(is_red(node) && is_red(prt)) {
        console.log("F: red and red", node, prt);
      }
      dfs(node.right, node, bdep);
    };
    const tree = redblack_tree;
    if(tree.root !== null && tree.root.color === 1) {
      console.log("F: root is red", tree.root);
    }
    dfs(tree.root, null, 0);
    let max_depth = 0;
    leaves.forEach
    for(let [node, bdep] of leaves) {
      max_depth = Math.max(max_depth, bdep);
    }
    if(leaves.some((e) => e[1] !== max_depth)) {
      for(let [node, bdep] of leaves) {
        console.log("F: black depth", node, bdep, max_depth);
      }
    }
    console.log("checked");
  };

  $(".add").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      add_tree_node(v);
    }
  });

  $(".remove").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      remove_tree_node(v);
    }
  });
};
