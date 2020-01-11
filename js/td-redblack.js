"use strict";

function is_black(node) {
  return (node === null) || (node.color === Node.BLACK);
}

function is_red(node) {
  return !is_black(node);
}

class Node extends BaseNode {
  constructor(val) {
    super(val);
    // 0 = black, 1 = red
    this.color = Node.RED;
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

  *insert(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      const new_node = new Node(x);
      this.root = new_node;
      yield new_node;

      new_node.color = Node.BLACK;
      yield;
      return;
    }

    let node = this.root;
    while(node.val !== x) {
      this.update_nodes.add(node);
      if(is_red(node.left) && is_red(node.right)) {
        const prt = node.prt;
        if(is_black(prt)) {
          // Case 1
          node.color = (prt === null ? Node.BLACK : Node.RED);
          node.left.color = Node.BLACK;
          node.right.color = Node.BLACK;
          yield;

          this.update_nodes.add(node.left);
          this.update_nodes.add(node.right);
        } else {
          const gprt = prt.prt;
          // assert (gprt !== null);
          if(gprt.is_left(prt)) {
            if(prt.is_left(node)) {
              // Case 2
              gprt.rotate_right();
              if(prt.prt === null) {
                this.root = prt;
              }
              yield;

              gprt.color = node.color = Node.RED;
              prt.color = node.left.color = node.right.color = Node.BLACK;
              yield;

              this.update_nodes.add(node.left);
              this.update_nodes.add(node.right);
            } else {
              // Case 3
              prt.rotate_left();
              yield;

              node.color = Node.RED;
              node.right.color = prt.right.color = Node.BLACK;
              yield;

              this.update_nodes.add(node.right);
              this.update_nodes.add(prt.right);

              gprt.rotate_right();
              if(node.prt === null) {
                this.root = node;
              }
              yield;

              node.color = Node.BLACK;
              gprt.color = Node.RED;
              yield;
            }
          } else {
            if(prt.is_left(node)) {
              // Case 3
              prt.rotate_right();
              yield;

              node.color = Node.RED;
              node.left.color = prt.left.color = Node.BLACK;
              yield;

              this.update_nodes.add(node.left);
              this.update_nodes.add(prt.left);

              gprt.rotate_left();
              if(node.prt === null) {
                this.root = node;
              }
              yield;

              node.color = Node.BLACK;
              gprt.color = Node.RED;
              yield;
            } else {
              // Case 2
              gprt.rotate_left();
              if(prt.prt === null) {
                this.root = prt;
              }
              yield;

              gprt.color = node.color = Node.RED;
              prt.color = node.left.color = node.right.color = Node.BLACK;
              yield;

              this.update_nodes.add(node.left);
              this.update_nodes.add(node.right);
            }
          }
        }
      }
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }

    if(x === node.val) {
      return;
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    yield new_node;

    if(is_red(node)) {
      const prt = node.prt;
      // assert(prt !== null);
      if(prt.is_left(node)) {
        if(node.is_left(new_node)) {
          // zig-zig
          prt.rotate_right();
          if(node.prt === null) {
            this.root = node;
          }
          yield;

          prt.color = Node.RED;
          node.color = Node.BLACK;
          yield;
        } else {
          // zig-zag
          node.rotate_left();
          yield;

          prt.rotate_right();
          if(new_node.prt === null) {
            this.root = new_node;
          }
          yield;

          new_node.color = Node.BLACK;
          prt.color = Node.RED;
          yield;
        }
      } else {
        if(node.is_left(new_node)) {
          // zig-zag
          node.rotate_right();
          yield;

          prt.rotate_left();
          if(new_node.prt === null) {
            this.root = new_node;
          }
          yield;

          new_node.color = Node.BLACK;
          prt.color = Node.RED;
          yield;
        } else {
          // zig-zig
          prt.rotate_left();
          if(node.prt === null) {
            this.root = node;
          }
          yield;

          prt.color = Node.RED;
          node.color = Node.BLACK;
          yield;
        }
      }
    }
  }

  *remove(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      return;
    }

    let first = true;
    let node = this.root, prt = null;
    let target_node = null, succ_node = null;
    while(node !== null) {
      this.update_nodes.add(node);

      if(is_black(node.left) && is_black(node.right)) {
        node.color = Node.RED;
        yield;

        if(!first) {
          // Case 2A
          // assert(prt !== null);
          const sib = prt.get_sib(node);
          if(sib !== null) {
            if(is_black(sib.left) && is_black(sib.right)) {
              // Case 2A1
              sib.color = Node.RED;
              prt.color = Node.BLACK;
              yield;

              this.update_nodes.add(sib);
            } else {
              if(prt.is_left(node)) {
                if(is_red(sib.right)) {
                  // Case 2A3L
                  prt.rotate_left();
                  if(sib.prt === null) {
                    this.root = sib;
                  }
                  yield;

                  sib.color = Node.RED;
                  prt.color = sib.right.color = Node.BLACK;
                  yield;

                  this.update_nodes.add(sib);
                  this.update_nodes.add(sib.right);
                } else {
                  // Case 2A2L
                  sib.rotate_right();
                  yield;

                  const r = prt.rotate_left();
                  if(r.prt === null) {
                    this.root = r;
                  }
                  yield;

                  prt.color = Node.BLACK;
                  yield;

                  this.update_nodes.add(sib);
                  this.update_nodes.add(sib.prt);
                }
              } else {
                if(is_red(sib.left)) {
                  // Case 2A3R
                  prt.rotate_right();
                  if(sib.prt === null) {
                    this.root = sib;
                  }
                  yield;

                  sib.color = Node.RED;
                  prt.color = sib.left.color = Node.BLACK;
                  yield;

                  this.update_nodes.add(sib);
                  this.update_nodes.add(sib.left);
                } else {
                  // Case 2A2R
                  sib.rotate_left();
                  yield;

                  const r = prt.rotate_right();
                  if(r.prt === null) {
                    this.root = r;
                  }
                  yield;

                  prt.color = Node.BLACK;
                  yield;

                  this.update_nodes.add(sib);
                  this.update_nodes.add(sib.prt);
                }
              }
            }
          }
        }
        prt = node;
        if(x < node.val) {
          node = node.left;
        } else {
          node = node.right;
        }
        if(prt !== null && prt.val === x) {
          target_node = prt;
          if(prt.left === null || prt.right === null) {
            break;
          }
        }
      } else {
        // Step 2B
        prt = node;
        if(x < node.val) {
          node = node.left;
        } else {
          node = node.right;
        }
        if(is_red(node)) {
          // Case 2B1
          if(prt !== null && prt.val === x) {
            target_node = prt;
            if(prt.left === null || prt.right === null) {
              break;
            }
          }
          this.update_nodes.add(node);
          prt = node;
          if(x < node.val) {
            node = node.left;
          } else {
            node = node.right;
          }
          if(prt !== null && prt.val === x) {
            target_node = prt;
            if(prt.left === null || prt.right === null) {
              break;
            }
          }
        } else {
          // Case 2B2
          prt.color = Node.RED;
          yield;

          const sib = prt.get_sib(node);
          // assert(sib.color === Node.RED);
          this.update_nodes.add(sib);
          if(prt.is_left(node)) {
            prt.rotate_left();
          } else {
            prt.rotate_right();
          }
          if(sib.prt === null) {
            this.root = sib;
          }
          yield;

          sib.color = Node.BLACK;
          yield;

          this.update_nodes.add(sib);

          if(prt !== null && prt.val === x) {
            target_node = prt;
            if(prt.left === null || prt.right === null) {
              break;
            }
          }
        }
      }
      first = false;
    }

    if(prt !== null && prt.val === x) {
      // assert (prt === target_node);
      const node = target_node, prt = target_node.prt;
      const n_node = node.left || node.right;
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(n_node);
        } else {
          prt.set_right(n_node);
        }
      } else {
        node.remove_child(n_node);
        this.root = n_node;
      }
      if(n_node !== null) {
        n_node.color = node.color;
      }
      yield node;
    } else if(target_node !== null) {
      const b_node = target_node, b_prt = target_node.prt;
      const c_node = prt, c_prt = c_node.prt;
      const is_child = b_node.is_right(c_node);
      if(!is_child) {
        c_prt.set_left(c_node.right);
        c_node.set_right(b_node.right);
      }
      c_node.set_left(b_node.left);
      if(b_prt !== null) {
        if(x < b_prt.val) {
          b_prt.set_left(c_node);
        } else {
          b_prt.set_right(c_node);
        }
      } else {
        b_node.remove_right();
        this.root = c_node;
      }
      c_node.color = b_node.color;
      yield b_node;
    }

    if(is_red(this.root)) {
      this.root.color = Node.BLACK;
      yield;
    }
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
  }
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

  const translate_obj = (result) => {
    default_translate_obj(node_map, result, tl);
    tl.add({
      targets: ['circle.node-circle'],
      stroke: [{value: (el) => {
        const n_id = el.parentNode.getAttribute("nid");
        const node = node_map[n_id];
        return (node.color === Node.RED ? "#ff0000" : "#000000");
      }}],
      offset: '-=1000',
      duration: 1000,
    });
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

    tl.add({
      duration: 1000,
    });

    let max_depth = traverse(tree.root).depth;

    let v_n_id = null;
    let target_node = null;

    const step = tree.remove(v);
    while(true) {
      const {value: node, done: done} = step.next();
      if(done) break;
      if(node !== undefined) {
        v_n_id = node.id;
        target_node = node_view[v].node;
        hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);
      }
      const {ps: result, depth: depth} = traverse(tree.root);

      if(v_n_id !== null) {
        result[v_n_id] = [0, 0];
      }

      translate_obj(result);
      max_depth = Math.max(max_depth, depth);
    }

    if(v_n_id !== null) {
      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = tree.get_update_nodes().filter(node => node.val !== v).map(node => node_view[node.val].node);
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

    let max_depth = traverse(tree.root).depth;

    const step = tree.insert(v);
    while(true) {
      const {value: node, done: done} = step.next();
      if(done) break;
      if(node !== undefined) {
        add_node(v, node);
      }
      const {ps: result, depth: depth} = traverse(tree.root);

      translate_obj(result);
      max_depth = Math.max(max_depth, depth);
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
