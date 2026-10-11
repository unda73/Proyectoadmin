#!/bin/bash
cd "/home/sergiounda/Sisteme admin" || exit 1
exec "/usr/local/bin/node" servidor.cjs >> servidor.log 2>&1
