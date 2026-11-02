/**
 * The words a passphrase is drawn from when you bring no list of your own:
 * everyday English, three to nine letters, no proper nouns, no two spelled
 * alike, easy to read aloud and to type. More than a thousand of them, so each
 * word adds a little over ten bits. A longer list makes a stronger passphrase;
 * a list of 7,776 words, such as the EFF's, adds almost thirteen bits a word.
 */
const WORDS = `
acorn alder amber anchor antler aspen basalt basin bayou beach birch bluff boulder bramble breeze brook canyon cavern cedar cliff clover coast copper coral
cove crag creek crest crystal cypress dale delta desert dune dusk ember estuary fern field fjord flint foam forest fossil frost geyser glacier glade gorge
gravel grotto grove gulf harbor hazel heath hedge hickory hollow island ivy jade jungle kelp knoll lagoon lake lava ledge lichen lilac limestone loam lotus
maple marble marsh meadow mesa mist moor moss mound mountain nectar oasis ocean olive orchard peak pebble pine plateau pond poplar prairie quartz quarry
rapids ravine reed reef ridge river sage sand savanna shale shore sierra silt slope snow spring spruce steppe stone storm stream summit swamp thicket
thistle timber trail tundra valley vapor violet volcano walnut wave willow woods
antelope badger beaver bison buffalo butterfly camel canary cardinal caribou cheetah cicada cobra condor cougar coyote crane cricket deer dingo dolphin
donkey dove dragonfly eagle egret elk falcon ferret finch firefly flamingo fox frog gazelle gecko giraffe goat goose gopher gorilla grouse gull hamster
hare hawk hedgehog heron hornet horse hyena ibex iguana impala jackal jaguar kangaroo kitten koala lemur leopard lion lizard llama lobster
lynx magpie mallard mammoth manatee marmot meerkat mink mole monkey moose moth mule narwhal newt ocelot octopus orca osprey otter panda panther parrot
peacock pelican penguin pheasant pigeon puffin puma quail rabbit raccoon raven reindeer robin salmon seagull seal shark sheep sparrow squid squirrel
stork swallow swan tapir tiger toad tortoise toucan trout turkey turtle viper vulture walrus wasp weasel whale wolf wombat yak zebra
almond apple apricot avocado bagel banana barley basil bean berry biscuit bread broccoli butter cabbage cacao cake candy caramel carrot celery cheese
cherry chestnut chili cider cinnamon citrus clove cocoa coconut coffee cookie cranberry cream cucumber curry custard date dill dumpling fennel flour garlic
ginger grape guava hazelnut honey jelly kale kiwi lemon lentil lettuce lime mango melon millet mint mocha muffin mushroom mustard noodle nutmeg oat onion
orange oregano pancake papaya parsley pasta peach peanut pear pecan pepper pickle pineapple pistachio pizza plum popcorn potato pretzel pudding pumpkin
radish raisin raspberry rice rosemary saffron salad salsa sesame soup spinach sugar syrup tea thyme tomato truffle turnip vanilla waffle wheat yogurt zucchini
anvil apron arrow atlas badge ballot bandage banner barrel basket beacon bell bench bicycle binder blanket blender boat bolt bottle bowl bracelet bridge
brush bucket buckle button cabin cable camera candle canvas carpet carton castle chain chair chalk chimney clock compass cork cradle crayon cup curtain
cushion dagger dial diary dish drawer drum easel engine fabric fan fence ferry flag flask flute fork fountain frame funnel garden gate glove goblet hammer
hammock handle harp helmet hinge hook hourglass jar jacket kettle key kite knife ladder lamp lantern latch lens letter locket lock magnet map mask mirror
mitten mortar nail needle notebook ornament oven paddle paint pencil pillow pipe pitcher plank plate pocket pulley quilt radio rake razor ribbon rocket
rope rudder saddle sail satchel scarf scissors screw shelf shovel sieve skillet sled slipper spade spoon stamp stool suitcase sword table teapot thimble
ticket tile toaster torch towel tray trophy trumpet umbrella vase violin wagon wallet whistle window wrench
azure beige bronze brown cobalt crimson cyan denim ebony emerald golden granite graphite indigo ivory khaki lavender maroon mauve navy ochre pearl pewter
pink platinum purple ruby rust sable sapphire scarlet silver slate steel teal topaz turquoise umber yellow circle cone cube curve cylinder diamond disc
oval prism pyramid ring sphere spiral square star triangle
abbey academy airport alley arcade arena attic balcony bakery bazaar bistro bookshop cafe campus cellar chapel cinema citadel clinic college corridor
cottage courtyard dock dome dormitory estate factory farmhouse fortress foundry gallery garage gazebo hotel library lodge market mansion
monastery museum palace pavilion pier plaza porch quay refuge resort stadium station studio temple terrace theater tower tunnel village
warehouse workshop
aurora blizzard cirrus climate comet cosmos crater drizzle eclipse equinox galaxy gravity gust hail horizon humid lightning lunar meteor monsoon nebula nova
orbit ozone planet plasma pulsar quasar radar rainbow satellite shower solstice solar spectrum sunrise sunset thunder tide tornado twilight vortex zenith
atom carbon cell electron enzyme fusion gene helium hydrogen ion isotope laser matter molecule neutron neon nucleus oxygen photon proton quantum sodium vector
alto anthem ballad banjo bass cadence carol chorus cello chime cymbal ensemble fiddle fugue guitar harmony jazz lyric melody motif opera organ piano
prelude rhythm sonata soprano tango tempo tenor tune ukulele verse waltz archery badminton ballet baseball boxing bowling canoe chess cycling dance darts
diving fencing hockey judo kayak karate lacrosse marathon polo rowing rugby sailing skating skiing soccer surfing tennis triathlon yoga
adjust arrive bake balance bend bloom borrow bounce brew build carry carve catch chase climb collect craft crawl deliver design dig discover dive drift
drive explore fetch float fly follow forge gather glide grow guide hatch hike hunt imagine invent jump knit launch learn leap lift listen march measure mend
mix mold navigate pause plant polish ponder pour pull push race reach rest return ride rise roam roll sculpt search settle shape shine sketch skate slide
soar sow spin squeeze stack steer stitch stretch sweep swim swing tackle travel twist unfold wander weave wield wonder write yield
ancient able active agile alert ample brave bright brisk broad calm candid careful clever cozy crisp curious daring dapper dazzling deep dense eager early
earnest elegant epic even faithful fancy fast fertile fierce fine firm fluent fond frank fresh friendly gentle giant glad gleaming graceful grand great
happy hardy hearty humble idle jolly keen kind lively lofty loyal lucid lucky lush mellow merry mighty modest narrow neat nimble noble novel patient peppy
plain playful polite proud prompt pure quick quiet radiant rapid rare ready robust rosy round royal rustic safe serene sharp shiny silent silky simple sleek
smooth snug solid sound spare spry steady stout sturdy sunny supple sweet swift tall tender tidy tiny tranquil true trusty vast vivid warm wavy wild wise
witty young zesty
action advice alarm answer arrival banquet beginning bonus breath budget bundle cadet capital carnival chapter charm choice circuit comfort courage crowd
custom dawn debate detail dream echo effort empire energy episode escape event fable fashion feast festival figure finale flavor fortune freedom future
gesture glimpse glory habit harvest heritage history honor humor idea impulse journal journey justice kindness legend lesson liberty lineage lounge luxury
magic marvel memory message miracle moment mission mystery notion novelty oath odyssey offer origin outcome parade passage pattern peace period picnic
pilgrim plan pledge poem pride promise puzzle quest quote rally reason recipe remedy report respect reward riddle ritual romance rumor safari saga scene
season secret signal silence solace spirit sprint story style summer surprise symbol talent theme thrill tradition treasure triumph trust unity venture
vision voyage wealth welcome wisdom
`;

/** The default word list: unique, lower case, in the order written. */
export const DEFAULT_WORDLIST: readonly string[] = [...new Set(WORDS.split(/\s+/).filter(Boolean))];
