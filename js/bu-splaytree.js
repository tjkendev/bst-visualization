"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++node_id_gen;
  }

  remove_child(child) {
    if(this.left === child) {
      this.left = child.prt = null;
    }
    if(this.right === child) {
      this.right = child.prt = null;
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
}

class BottomUpSplayTree {
  constructor() {
    this.clear();
    this.update_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
  }

  find(x, need_to_add) {
    this.update_nodes = [];
    if(this.root === null) {
      this.cur = null;
      if(need_to_add) {
        this.root = new Node(x);
        return this.root;
      }
      return null;
    }
    let node = this.root;
    while(node.val !== x) {
      this.update_nodes.push(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    if(x === node.val) {
      this.cur = node;
      return null;
    }

    if(need_to_add) {
      const new_node = new Node(x);
      if(x < node.val) {
        node.set_left(new_node);
      } else {
        node.set_right(new_node);
      }
      this.cur = new_node;
      return new_node;
    }
    this.cur = node;
    return null;
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  splaying() {
    while(splaying_step());
  }

  splaying_step() {
    if(this.cur === null) {
      return false;
    }
    const x = this.cur;
    if(x.prt === null) {
      this.root = x;
      this.cur = null;
      return false;
    }
    const y = x.prt;
    if(y.prt === null) {
      // zig
      x.prt = null;
      if(y.is_left(x)) {
        y.rotate_right();
      } else {
        y.rotate_left();
      }
      this.root = x;
      this.cur = null;
      return true;
    }
    const z = y.prt;
    if(y.is_left(x)) {
      if(z.is_left(y)) {
        // zig-zig
        z.rotate_right();
        y.rotate_right();
      } else {
        // zig-zag
        y.rotate_right();
        z.rotate_left();
      }
    } else {
      if(z.is_left(y)) {
        // zig-zag
        y.rotate_left();
        z.rotate_right();
      } else {
        // zig-zig
        z.rotate_left();
        y.rotate_left();
      }
    }
    if(x.prt === null) {
      this.root = x;
      this.cur = null;
      return false;
    }
    return true;
  }
}

window.onload = () => {
  const tree = new BottomUpSplayTree();

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

  const translate_obj = (result) => {
    default_translate_obj(node_map, result, tl);
  }

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

    tree.find(v, false);
    const updates = [];

    let max_depth = 0;
    let updated = true;
    while(true) {
      const result = traverse(tree.root);

      max_depth = Math.max(max_depth, result.depth);

      translate_obj(result.ps);
      if(!updated) {
        break;
      }
      updated = tree.splaying_step();
    }
    updates.push(...tree.get_update_nodes());

    const node = tree.root;
    let v_n_id = null;
    let target_node = null;

    if(node.val === v) {
      const left = node.remove_left(), right = node.remove_right();

      const result_l = traverse(left);
      max_depth = Math.max(max_depth, result_l.depth);

      v_n_id = node.id;
      target_node = node_view[v].node;

      hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);

      if(right !== null) {
        tree.root = right;

        if(right.left !== null) {
          tree.find(v, false);

          let updated = true;
          while(true) {
            const result = {};
            const result_r = traverse(tree.root);

            let cursor = 0;
            for(let n_id in result_l.ps) {
              const v = result_l.ps[n_id];
              result[n_id] = [v[0], v[1] + 1];
            }
            cursor += Object.keys(result_l.ps).length + 2;
            result[v_n_id] = [cursor, 0];
            cursor += 2;
            for(let n_id in result_r.ps) {
              const v = result_r.ps[n_id];
              result[n_id] = [v[0] + cursor, v[1] + 1];
            }
            max_depth = Math.max(max_depth, result_r.depth);

            translate_obj(result);
            if(!updated) {
              break;
            }
            updated = tree.splaying_step();
          }
          updates.push(...tree.get_update_nodes());
        }

        tree.root.set_left(left);
        {
          const result_m = traverse(tree.root);
          const result = result_m.ps;
          max_depth = Math.max(max_depth, result_m.depth);
          result[v_n_id] = [0, 0];
          translate_obj(result);
        }
      } else {
        tree.root = left;
        if(left !== null) {
          const result_m = traverse(tree.root);
          const result = result_m.ps;
          max_depth = Math.max(max_depth, result_m.depth);
          result[v_n_id] = [0, 0];
          translate_obj(result);
        }
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = updates.map(node => node_view[node.val].node);
    begin_change_color(target_node, update_nodes);
    tl.complete = () => {
      end_change_color(target_node, update_nodes);
    };
    delete_n_id = v_n_id;

    change_canvas_size(
      (node_num+5) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    init_timeline();

    const result_f = traverse(tree.root);
    let max_depth = result_f.depth;
    translate_obj(result_f.ps);

    const node = tree.find(v, true);
    if(node !== null) {
      add_node(v, node);
    }

    let updated = true;
    while(true) {
      const result = traverse(tree.root);

      max_depth = Math.max(max_depth, result.depth);

      translate_obj(result.ps);
      if(!updated) {
        break;
      }
      updated = tree.splaying_step();
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
