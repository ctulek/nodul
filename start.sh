#!/usr/bin/env bash
CURRENT_DIR=`pwd`
NODE_PATH=$NODE_PATH:$CURRENT_DIR/src/
export NODE_PATH
node $1