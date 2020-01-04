"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.height = 1;
    this.id = ++node_id_gen;
  }

  factor() {
    const lv = (this.left !== null ? this.left.height : 0);
    const rv = (this.right !== null ? this.right.height : 0);
    return rv - lv;
  }

  update_height() {
    this.height = Math.max(
      (this.left !== null ? this.left.height : 0),
      (this.right !== null ? this.right.height : 0)
    ) + 1;
  }

  remove_child(node) {
    if(this.left === node) {
      this.remove_left();
    }
    if(this.right === node) {
      this.remove_right();
    }
    this.update_height();
  }

  remove_left() {
    const left = this.left;
    if(left !== null) {
      this.left = left.prt = null;
    }
    this.update_height();
    return left;
  }
  remove_right() {
    const right = this.right;
    if(right !== null) {
      this.right = right.prt = null;
    }
    this.update_height();
    return right;
  }

  set_left(node) {
    if(this.left !== null) {
      this.remove_left();
    }
    this.left = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
    this.update_height();
  }

  set_right(node) {
    if(this.right !== null) {
      this.remove_right();
    }
    this.right = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
    this.update_height();
  }

  rotate_left() {
    const r = this.right;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(r === null) {
      return null;
    }
    this.set_right(r.left);
    this.update_height();
    r.set_left(this);
    r.update_height();

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
    this.update_height();
    l.set_right(this);
    l.update_height();

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
}

class AVLTree {
  constructor() {
    this.root = null;
    this.cur = null;
    this.prt = null;
    this.update_nodes = new Set();
  }

  insert(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      return this.root = new Node(x);
    }
    let node = this.root;
    while(node !== null) {
      if(node.val === x) {
        return null;
      }
      this.update_nodes.add(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    const new_node = new Node(x);
    this.cur = new_node;
    this.prt = node;
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    let cur = node;
    while(cur !== null) {
      cur.update_height();
      cur = cur.prt;
    }
    return new_node;
  }

  remove(x) {
    this.update_nodes = new Set();
    this.cur = this.prt = null;
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
      }
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
    }
    let cur = node;
    while(cur !== null) {
      cur.update_height();
      cur = cur.prt;
    }
    return node;
  }

  is_retracing() {
    return (this.prt !== null);
  }

  finish_retracing() {
    this.cur = this.prt = null;
    return true;
  }

  insert_retracing_step() {
    const node = this.cur, prt = this.prt;
    if(prt === null) {
      return this.finish_retracing();
    }
    // assert (node !== null);
    let update = false;
    prt.update_height();
    if(prt.is_left(node)) {
      if(prt.factor() == -2) {
        if(node.factor() > 0) {
          node.rotate_left();
          this.prt = prt.rotate_right();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          prt.rotate_right();
          this.prt = node.prt;
          if(node.prt === null) {
            this.root = node;
          }
        }
        update = true;
      } else {
        if(prt.factor() >= 0) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
      }
    } else {
      if(prt.factor() == 2) {
        if(node.factor() < 0) {
          node.rotate_right();
          this.prt = prt.rotate_left();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          prt.rotate_left();
          this.prt = node.prt;
          if(node.prt === null) {
            this.root = node;
          }
        }
        update = true;
      } else {
        if(prt.factor() <= 0) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
      }
    }
    let cur = node;
    while(cur !== null) {
      cur.update_height();
      cur = cur.prt;
    }
    return update;
  }

  remove_retracing_step() {
    const node = this.cur, prt = this.prt;
    if(prt === null) {
      return this.finish_retracing();
    }
    let update = false;
    prt.update_height();
    if(prt.is_left(node)) {
      if(prt.factor() == 2) {
        const sib = prt.right;
        this.update_nodes.add(sib);
        if(sib.factor() < 0) {
          this.update_nodes.add(sib.left);
          sib.rotate_right();
          this.cur = prt.rotate_left();
          this.prt = this.cur.prt;
        } else {
          this.cur = prt.rotate_left();
          this.prt = this.cur.prt;
        }
        if(this.prt === null) {
          this.root = this.cur;
        }
        update = true;
      } else {
        if(prt.factor() == 1) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        if(this.prt === null) {
          this.root = this.cur;
        }
      }
    } else {
      if(prt.factor() == -2) {
        const sib = prt.left;
        this.update_nodes.add(sib);
        if(sib.factor() > 0) {
          this.update_nodes.add(sib.right);
          sib.rotate_left();
          this.cur = prt.rotate_right();
          this.prt = this.cur.prt;
        } else {
          this.cur = prt.rotate_right();
          this.prt = this.cur.prt;
        }
        if(this.prt === null) {
          this.root = this.cur;
        }
        update = true;
      } else {
        if(prt.factor() == -1) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        if(this.prt === null) {
          this.root = this.cur;
        }
      }
    }
    let cur = node;
    while(cur !== null) {
      cur.update_height();
      cur = cur.prt;
    }
    return update;
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
  }

  retracing(v) {
    while(this.is_retracing()) this.insert_retracing_step();
  }
}

function translate_obj(node_map, result, tl) {
  tl.add({
    targets: ['g.node'],
    translateX: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_px(result[n_id]);
    },
    translateY: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_py(result[n_id]);
    },
    duration: 1000,
    easing: 'linear',
  }).add({
    targets: ['circle.node-circle'],
    stroke: [{value: (el) => {
      const n_id = el.parentNode.getAttribute("nid");
      const node = node_map[n_id];
      switch(node.factor()) {
        case -2:
          return "#0000ff";
        case -1:
          return "#8888ff";
        case 0: default:
          return "#000000";
        case 1:
          return "#ff8888";
        case 2:
          return "#ff0000";
      }
    }}],
    offset: '-=1000',
    duration: 1000,
  }).add({
    targets: ['path.edge'],
    d: [{value: (el) => {
      const n_id = el.getAttribute("nid");
      const node = node_map[n_id];
      const [fx, fy] = get_edge_pos(result[n_id]);

      const l_child = node.left, r_child = node.right;
      let l_tx = fx, l_ty = fy;
      if(l_child !== null) {
        [l_tx, l_ty] = get_edge_pos(result[l_child.id]);
      }
      let r_tx = fx, r_ty = fy;
      if(r_child !== null) {
        [r_tx, r_ty] = get_edge_pos(result[r_child.id]);
      }
      return `M${l_tx},${l_ty}L${fx},${fy}L${r_tx},${r_ty}`;
    }}],
    offset: '-=1000',
    duration: 1000,
    easing: 'linear',
  });
}

window.onload = () => {
  const tree = new AVLTree();

  const node_view = {}, node_map = {};
  let tl = null;

  const canvas = document.querySelector("svg.canvas");
  const nodes = document.querySelector(".nodes");
  const edges = document.querySelector(".edges");
  const slider = document.querySelector(".anime-slider");
  slider.oninput = ((el) => {
    if(tl !== null) {
      tl.seek(tl.duration * (slider.value / 100));
    }
  });
  let delete_n_id = null;

  const add_node = (v, node) => {
    const n_id = node.id;
    nodes.appendChild(createNode(v, n_id));
    edges.appendChild(createEdge(v, n_id));
    const d_node = document.querySelector(`g.node${n_id}`);
    const d_edge = document.querySelector(`path.edge${n_id}`);

    node_view[v] = {
      "node": d_node,
      "edge": d_edge,
    };
    node_map[n_id] = node;
  };

  const change_canvas_size = (width, height) => {
    const style = canvas.style;
    style["width"] = `${width}px`;
    style["height"] = `${height}px`;
  };

  const init_timeline = () => {
    if(delete_n_id !== null) {
      const n_id = delete_n_id;
      removeNode(n_id);
      removeEdge(n_id);
      delete_n_id = null;
    }
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
      update: (anim) => {
        slider.value = tl.progress;
      },
    });
  };

  const remove_tree_node = (v) => {
    const node_num = Object.keys(node_view).length;

    init_timeline();

    let max_depth = traverse(tree.root).ps;
    tl.add({
      duration: 1000,
    });

    let v_n_id = null;
    let target_node = null;

    const node = tree.remove(v);
    if(node !== null) {
      target_node = node_view[v].node;
      v_n_id = node.id;

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

      {
        const result = traverse(tree.root).ps;
        result[v_n_id] = [0, 0];
        translate_obj(node_map, result, tl);
      }

      while(tree.is_retracing()) {
        if(!tree.remove_retracing_step()) {
          continue;
        }
        const result_m = traverse(tree.root);
        const result = result_m.ps;
        result[v_n_id] = [0, 0];
        translate_obj(node_map, result, tl);
        max_depth = Math.max(max_depth, result_m.depth);
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    begin_change_color(target_node, update_nodes);
    tl.complete = () => {
      end_change_color(target_node, update_nodes);
    };
    delete_n_id = v_n_id;

    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    init_timeline();

    tl.add({
      duration: 1000,
    });

    const node = tree.insert(v);
    if(node !== null) {
      add_node(v, node);
    }

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      translate_obj(node_map, result_m.ps, tl);
      max_depth = result_m.depth;
    }

    while(tree.is_retracing()) {
      if(!tree.insert_retracing_step()) {
        continue;
      }
      const result_m = traverse(tree.root);
      translate_obj(node_map, result_m.ps, tl);
      max_depth = Math.max(max_depth, result_m.depth);
    }

    const target_node = node_view[v].node;
    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);

    begin_change_color(target_node, update_nodes);
    tl.complete = () => {
      end_change_color(target_node, update_nodes);
    };
    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
