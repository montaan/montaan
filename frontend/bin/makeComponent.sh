# Creates pre-populated component directories based on templates/Component
#
# USAGE
# makeComponent.sh COMPONENT_NAME [TARGET_DIR]
#
# Examples:
#
# Create component MyComponent in src/components/
#
#     makeComponent.sh MyComponent
#     OR
#     makeComponent.sh MyComponent components
#
# Create component Footer in src/containers/
#
#     makeComponent.sh Footer containers
#
# Create component Home in src/screens/
#
#     makeComponent.sh Home screens

NAME=$1
TARGET=components
if [ ! -z $2 ]
then
	TARGET=$2
fi

if [ ! -e src/"$TARGET"/"$NAME" ]
then
	cp -r templates/Component src/"$TARGET"/"$NAME" &&
	sed -i '' -e s/%%TARGET%%/"$TARGET"/g src/"$TARGET"/"$NAME"/{index.js,index.test.js,css/style.module.scss}
	sed -i '' -e s/%%NAME%%/"$NAME"/g src/"$TARGET"/"$NAME"/{index.js,index.test.js,css/style.module.scss}
else
	echo Component "$NAME" already exists in "$TARGET";
	exit 1
fi