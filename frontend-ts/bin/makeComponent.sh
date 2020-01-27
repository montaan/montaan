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
AUTHOR=$(echo `git config --get user.name` '<'`git config --get user.email`'>')

if [ ! -z $2 ]
then
	TARGET=$2
fi

if [ ! -e src/"$TARGET"/"$NAME" ]
then
	echo "Creating $TARGET/$NAME with author $AUTHOR"
	mkdir -p src/"$TARGET" &&
	cp -r templates/Component src/"$TARGET"/"$NAME" &&
	sed -i '' -e s/%%TARGET%%/"$TARGET"/g src/"$TARGET"/"$NAME"/{index.tsx,index.test.tsx,css/style.module.scss,README.md}
	sed -i '' -e s/%%NAME%%/"$NAME"/g src/"$TARGET"/"$NAME"/{index.tsx,index.test.tsx,css/style.module.scss,README.md}
	sed -i '' -e s/%%AUTHOR%%/"$AUTHOR"/g src/"$TARGET"/"$NAME"/{index.tsx,index.test.tsx,css/style.module.scss,README.md}
	echo OK
else
	echo Component "$NAME" already exists in "$TARGET";
	exit 1
fi
