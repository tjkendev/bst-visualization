"use strict";

class Node extends BaseNode {
  constructor(val) {
    super(val);
    this.height = 1;
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
    super.remove_child(node);
    this.update_height();
  }

  remove_left() {
    const left = super.remove_left();
    this.update_height();
    return left;
  }
  remove_right() {
    const right = super.remove_right();
    this.update_height();
    return right;
  }

  set_left(node) {
    super.set_left(node);
    this.update_height();
  }

  set_right(node) {
    super.set_right(node);
    this.update_height();
  }

  rotate_left() {
    const r = super.rotate_left();
    this.update_height();
    r.update_height();
    return r;
  }

  rotate_right() {
    const l = super.rotate_right();
    this.update_height();
    l.update_height();
    return l;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
    this.cur = null;
    this.prt = null;
    this.update_nodes = new Set();
    this.current_nodes = [];
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
    this.current_nodes = [];
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
          this.current_nodes = [prt, node, node.right];
          node.rotate_left();
          this.prt = prt.rotate_right();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          this.current_nodes = [prt, node, node.left];
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
          this.current_nodes = [prt, node, node.left];
          node.rotate_right();
          this.prt = prt.rotate_left();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          this.current_nodes = [prt, node, node.right];
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
    this.current_nodes = [];
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
          this.current_nodes = [node, prt, sib, sib.left];
          this.update_nodes.add(sib.left);
          sib.rotate_right();
          this.cur = prt.rotate_left();
          this.prt = this.cur.prt;
        } else {
          this.current_nodes = [node, prt, sib];
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
          this.current_nodes = [node, prt, sib, sib.right];
          this.update_nodes.add(sib.right);
          sib.rotate_left();
          this.cur = prt.rotate_right();
          this.prt = this.cur.prt;
        } else {
          this.current_nodes = [node, prt, sib];
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

  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }

  retracing(v) {
    while(this.is_retracing()) this.insert_retracing_step();
  }
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

  const translate_obj = (result, t_node, c_nodes) => {
    default_translate_obj(node_map, result, tl);
    const t_view = (t_node !== null ? node_view[t_node.val].node : null);
    const c_views = c_nodes.map(node => node_view[node.val].node);
    tl.add({
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
            return "#d46a6a";
          case 2:
            return "#ff0000";
        }
      }}],
      duration: 1000,
      changeBegin: (tl) => {
        begin_change_current_color(t_view, c_views);
      },
      changeComplete: (tl) => {
        end_change_current_color(t_view, c_views);
      },
    }, '-=1000');
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
    tl.add({ duration: 500 });

    let v_n_id = null;
    let target_node = null;

    const node = tree.remove(v);
    if(node !== null) {
      target_node = node_view[v].node;
      v_n_id = node.id;

      hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);

      {
        const result = traverse(tree.root).ps;
        const c_nodes = tree.get_current_nodes();
        result[v_n_id] = [0, 0];
        translate_obj(result, node, c_nodes);
      }

      while(tree.is_retracing()) {
        if(!tree.remove_retracing_step()) {
          continue;
        }
        const result_m = traverse(tree.root);
        const result = result_m.ps;
        const c_nodes = tree.get_current_nodes();
        result[v_n_id] = [0, 0];
        translate_obj(result, node, c_nodes);
        max_depth = Math.max(max_depth, result_m.depth);
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    tl.add({ duration: 500 });

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    tl.changeBegin = () => {
      begin_change_color(target_node, update_nodes);
    };
    tl.changeComplete = () => {
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

    tl.add({ duration: 500 });

    const node = tree.insert(v);
    if(node !== null) {
      add_node(v, node);
    }

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      const c_nodes = tree.get_current_nodes();
      translate_obj(result_m.ps, node, c_nodes);
      max_depth = result_m.depth;
    }

    while(tree.is_retracing()) {
      if(!tree.insert_retracing_step()) {
        continue;
      }
      const result_m = traverse(tree.root);
      const c_nodes = tree.get_current_nodes();
      translate_obj(result_m.ps, node, c_nodes);
      max_depth = Math.max(max_depth, result_m.depth);
    }

    tl.add({ duration: 500 });

    const target_node = node_view[v].node;
    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);

    tl.changeBegin = () => {
      begin_change_color(target_node, update_nodes);
    };
    tl.changeComplete = () => {
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
