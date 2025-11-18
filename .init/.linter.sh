#!/bin/bash
cd /home/kavia/workspace/code-generation/microskill-learning-platform-263346-263364/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

