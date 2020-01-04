"use strict";

function is_black(node) {
  return (node === null) || (node.color === Node.BLACK);
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
    this.color = Node.RED;
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
Object.defineProperty(Node, 'BLACK', {
  value: 0,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(Node, 'RED', {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false,
});

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
        if(is_red(node)) {
          node.color = Node.BLACK;
          yield;
        }
        break;
      }
      if(is_black(prt)) {
        // do nothing
        break;
      }
      const gprt = prt.prt;
      // assert (prt.color === 1 && gprt !== null)
      const u = gprt.get_sib(prt);
      if(is_black(u)) {
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

        prt.color = Node.BLACK;
        gprt.color = Node.RED;
        yield;

        break;
      }

      prt.color = Node.BLACK;
      gprt.color = Node.RED;
      u.color = Node.BLACK;

      yield;
      node = gprt;
    }
  }

  *remove_rebalancing() {
    if(this.dnode_color === Node.RED) {
      return;
    }
    if(is_red(this.cur)) {
      this.cur.color = Node.BLACK;
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

        prt.color = Node.RED;
        sib.color = Node.BLACK;

        sib = prt.get_sib(node);
        this.update_nodes.add(sib);
        yield;
      }

      if([prt, sib, sib.left, sib.right].some(is_red)) {
        if(is_red(prt) && [sib, sib.left, sib.right].every(is_black)) {
          sib.color = Node.RED;
          prt.color = Node.BLACK;
          yield;
          break;
        }

        if(is_black(sib)) {
          if(prt.is_left(node) && is_black(sib.right) && is_red(sib.left)) {
            const r = sib.rotate_right();
            yield;

            r.color = Node.RED;
            r.right.color = Node.BLACK;
            this.update_nodes.add(r.right);
          } else if(prt.is_right(node) && is_black(sib.left) && is_red(sib.right)) {
            const r = sib.rotate_left();
            yield;

            r.color = Node.RED;
            r.left.color = Node.BLACK;
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
          prt.color = sib.right.color = Node.BLACK;
          this.update_nodes.add(sib.right);
          yield;
        } else {
          const r = prt.rotate_right();
          if(r.prt === null) this.root = r;
          yield;

          sib.color = prt.color;
          prt.color = sib.left.color = Node.BLACK;
          this.update_nodes.add(sib.left);
          yield;
        }
        break;
      }

      sib.color = Node.RED;
      yield;

      node = prt;
      prt = prt && prt.prt;
    }
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
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
      return (node.color === Node.RED ? "#ff0000" : "#000000");
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
  const tree = new BottomUpRedBlackTree();

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

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      translate_obj(node_map, result_m.ps, tl);
      max_depth = result_m.depth;
    }

    let v_n_id = null;
    let target_node = null;

    const node = tree.remove(v);
    if(node !== null) {
      v_n_id = node.id;
      target_node = node_view[v].node;

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
        const result = result_m.ps;
        result[v_n_id] = [0, 0];
        max_depth = Math.max(max_depth, result_m.depth);
        translate_obj(node_map, result, tl);

        if(!updated) break;
        updated = !step.next().done;
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

    const step = tree.insert_rebalancing();
    while(!step.next().done) {
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

  const check_constraints = () => {
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
    if(tree.root !== null && tree.root.color === Node.RED) {
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

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
