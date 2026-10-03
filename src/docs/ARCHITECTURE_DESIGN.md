# Iron's Spells Paper Plugin - Architecture Design

**Version**: 1.0  
**Date**: 2025-09-27  
**Target**: Paper 1.21.8

---

## 1. Package Structure

```
com.irons.spellbooks/
├── IronSpellsPaper.java                    # Main plugin class
├── config/
│   ├── ConfigManager.java                 # Configuration management
│   ├── SpellConfig.java                   # Spell-specific configuration
│   └── ServerConfig.java                  # Server-wide configuration
├── registry/
│   ├── SpellRegistry.java                 # Spell registration and lookup
│   ├── SchoolRegistry.java                # Spell school registration
│   ├── ItemRegistry.java                  # Custom item registration
│   ├── EffectRegistry.java                # Custom effect registration
│   ├── AttributeRegistry.java            # Custom attribute registration
│   └── SoundRegistry.java                 # Custom sound registration
├── spell/
│   ├── AbstractSpell.java                 # Base spell class
│   ├── SpellType.java                     # Spell metadata
│   ├── CastType.java                      # Cast type enum
│   ├── SpellContext.java                  # Casting context
│   ├── SpellResult.java                   # Casting result
│   ├── SpellCaster.java                   # Spell casting logic
│   ├── SpellCooldownManager.java          # Cooldown management
│   ├── SpellManaManager.java              # Mana management
│   ├── blood/                             # Blood school spells
│   ├── eldritch/                          # Eldritch school spells
│   ├── ender/                             # Ender school spells
│   ├── evocation/                        # Evocation school spells
│   ├── fire/                              # Fire school spells
│   ├── holy/                              # Holy school spells
│   ├── ice/                               # Ice school spells
│   ├── lightning/                         # Lightning school spells
│   └── nature/                            # Nature school spells
├── school/
│   ├── SchoolType.java                    # School metadata
│   └── SchoolManager.java                 # School-specific logic
├── item/
│   ├── CustomItem.java                    # Base custom item class
│   ├── SpellBook.java                     # Spell book implementation
│   ├── Scroll.java                        # Scroll implementation
│   ├── weapon/                            # Custom weapons
│   ├── armor/                             # Custom armor
│   ├── consumable/                        # Consumables
│   ├── material/                          # Materials
│   └── accessory/                         # Accessories (replaces Curios)
├── entity/
│   ├── CustomEntity.java                  # Base custom entity class
│   ├── mob/                               # Custom mobs
│   ├── projectile/                        # Spell projectiles
│   └── summon/                            # Summoned entities
├── effect/
│   ├── CustomEffect.java                  # Base custom effect class
│   └── (effect implementations)
├── player/
│   ├── PlayerData.java                    # Player spell data
│   ├── PlayerDataManager.java             # Data persistence
│   ├── SpellSelectionManager.java         # Spell selection
│   └── PlayerMana.java                    # Player mana management
├── combat/
│   ├── SpellDamage.java                   # Spell damage logic
│   ├── DamageType.java                    # Custom damage types
│   ├── ResistanceManager.java             # Resistance calculations
│   └── CombatManager.java                 # Combat coordination
├── gui/
│   ├── SpellBookGUI.java                  # Spell book inventory GUI
│   ├── SpellSelectionGUI.java             # Spell selection GUI
│   └── InventoryHandler.java             # Inventory click handling
├── command/
│   ├── CastCommand.java                  # Cast spell command
│   ├── LearnCommand.java                 # Learn spell command
│   ├── ManaCommand.java                  # Mana management command
│   ├── SpellbookCommand.java              # Spellbook commands
│   └── AdminCommand.java                 # Admin/debug commands
├── listener/
│   ├── SpellCastListener.java             # Spell casting events
│   ├── PlayerJoinListener.java            # Player join handling
│   ├── PlayerQuitListener.java           # Player quit handling
│   ├── EntityDamageListener.java          # Combat events
│   ├── ItemUseListener.java              # Item interaction
│   └── BlockPlaceListener.java           # Block interaction
├── util/
│   ├── Raycast.java                       # Raycasting utilities
│   ├── ParticleUtil.java                  # Particle utilities
│   ├── SoundUtil.java                     # Sound utilities
│   └── DataUtil.java                      # Data serialization
└── api/
    ├── IronsSpellsAPI.java                # Public API for other plugins
    └── event/
        ├── SpellCastEvent.java            # Spell cast event
        ├── SpellDamageEvent.java         # Spell damage event
        └── ManaChangeEvent.java          # Mana change event
```

---

## 2. Core Classes

### 2.1 Main Plugin Class

```java
package com.irons.spellbooks;

import org.bukkit.plugin.java.JavaPlugin;

public class IronSpellsPaper extends JavaPlugin {
    
    private static IronSpellsPaper instance;
    
    // Manager instances
    private ConfigManager configManager;
    private SpellRegistry spellRegistry;
    private SchoolRegistry schoolRegistry;
    private ItemRegistry itemRegistry;
    private EffectRegistry effectRegistry;
    private AttributeRegistry attributeRegistry;
    private PlayerDataManager playerDataManager;
    
    @Override
    public void onEnable() {
        instance = this;
        
        // Initialize managers
        configManager = new ConfigManager(this);
        spellRegistry = new SpellRegistry(this);
        schoolRegistry = new SchoolRegistry(this);
        itemRegistry = new ItemRegistry(this);
        effectRegistry = new EffectRegistry(this);
        attributeRegistry = new AttributeRegistry(this);
        playerDataManager = new PlayerDataManager(this);
        
        // Register events
        registerEvents();
        
        // Register commands
        registerCommands();
        
        // Register attributes
        attributeRegistry.registerAttributes();
        
        getLogger().info("Iron's Spells 'n Spellbooks enabled!");
    }
    
    @Override
    public void onDisable() {
        // Cleanup
        playerDataManager.saveAll();
        
        getLogger().info("Iron's Spells 'n Spellbooks disabled!");
    }
    
    public static IronSpellsPaper getInstance() {
        return instance;
    }
    
    // Getters for managers
    public ConfigManager getConfigManager() { return configManager; }
    public SpellRegistry getSpellRegistry() { return spellRegistry; }
    public SchoolRegistry getSchoolRegistry() { return schoolRegistry; }
    public ItemRegistry getItemRegistry() { return itemRegistry; }
    public EffectRegistry getEffectRegistry() { return effectRegistry; }
    public AttributeRegistry getAttributeRegistry() { return attributeRegistry; }
    public PlayerDataManager getPlayerDataManager() { return playerDataManager; }
    
    private void registerEvents() {
        // Register event listeners
    }
    
    private void registerCommands() {
        // Register commands
    }
}
```

---

### 2.2 Spell System

#### AbstractSpell (Base Class)

```java
package com.irons.spellbooks.spell;

import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

public abstract class AbstractSpell {
    
    private final String id;
    private final SchoolType school;
    private final int baseManaCost;
    private final int baseCooldown;
    private final CastType castType;
    
    public AbstractSpell(String id, SchoolType school, int baseManaCost, int baseCooldown, CastType castType) {
        this.id = id;
        this.school = school;
        this.baseManaCost = baseManaCost;
        this.baseCooldown = baseCooldown;
        this.castType = castType;
    }
    
    // Getters
    public String getId() { return id; }
    public SchoolType getSchool() { return school; }
    public int getBaseManaCost() { return baseManaCost; }
    public int getBaseCooldown() { return baseCooldown; }
    public CastType getCastType() { return castType; }
    
    // Abstract methods to implement
    public abstract void onCast(SpellContext context);
    public abstract int getManaCost(int level);
    public abstract int getCooldown(int level);
    public abstract int getMaxLevel();
    public abstract String getDisplayName();
    public abstract String getDescription(int level);
    
    // Optional overrides
    public boolean canCast(LivingEntity caster) {
        return true;
    }
    
    public void onCastStart(SpellContext context) {
        // Optional cast start logic
    }
    
    public void onCastEnd(SpellContext context) {
        // Optional cast end logic
    }
}
```

#### SpellContext

```java
package com.irons.spellbooks.spell;

import org.bukkit.Location;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

public class SpellContext {
    
    private final LivingEntity caster;
    private final int spellLevel;
    private final Location castLocation;
    private final Vector direction;
    private final ItemStack castItem;
    
    public SpellContext(LivingEntity caster, int spellLevel, Location castLocation, Vector direction, ItemStack castItem) {
        this.caster = caster;
        this.spellLevel = spellLevel;
        this.castLocation = castLocation;
        this.direction = direction;
        this.castItem = castItem;
    }
    
    // Getters
    public LivingEntity getCaster() { return caster; }
    public int getSpellLevel() { return spellLevel; }
    public Location getCastLocation() { return castLocation; }
    public Vector getDirection() { return direction; }
    public ItemStack getCastItem() { return castItem; }
    
    public Player getCasterAsPlayer() {
        return caster instanceof Player ? (Player) caster : null;
    }
}
```

#### SpellResult

```java
package com.irons.spellbooks.spell;

public class SpellResult {
    
    private final boolean success;
    private final String message;
    
    public SpellResult(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public static SpellResult success() {
        return new SpellResult(true, null);
    }
    
    public static SpellResult success(String message) {
        return new SpellResult(true, message);
    }
    
    public static SpellResult failure(String message) {
        return new SpellResult(false, message);
    }
    
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
}
```

#### SpellCaster

```java
package com.irons.spellbooks.spell;

import com.irons.spellbooks.IronSpellsPaper;
import com.irons.spellbooks.player.PlayerData;
import com.irons.spellbooks.player.PlayerDataManager;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;

public class SpellCaster {
    
    private final IronSpellsPaper plugin;
    private final PlayerDataManager playerDataManager;
    
    public SpellCaster(IronSpellsPaper plugin) {
        this.plugin = plugin;
        this.playerDataManager = plugin.getPlayerDataManager();
    }
    
    public SpellResult castSpell(LivingEntity caster, String spellId, int spellLevel) {
        // Get spell from registry
        AbstractSpell spell = plugin.getSpellRegistry().getSpell(spellId);
        if (spell == null) {
            return SpellResult.failure("Spell not found: " + spellId);
        }
        
        // Check if caster is player
        if (caster instanceof Player) {
            Player player = (Player) caster;
            PlayerData playerData = playerDataManager.getPlayerData(player);
            
            // Check if player knows the spell
            if (!playerData.hasSpell(spellId)) {
                return SpellResult.failure("You don't know this spell");
            }
            
            // Check mana
            int manaCost = spell.getManaCost(spellLevel);
            if (playerData.getMana() < manaCost) {
                return SpellResult.failure("Not enough mana");
            }
            
            // Check cooldown
            if (playerData.isOnCooldown(spellId)) {
                return SpellResult.failure("Spell is on cooldown");
            }
            
            // Consume mana
            playerData.setMana(playerData.getMana() - manaCost);
            
            // Set cooldown
            playerData.setCooldown(spellId, spell.getCooldown(spellLevel));
        }
        
        // Check if spell can be cast
        if (!spell.canCast(caster)) {
            return SpellResult.failure("Cannot cast spell in current situation");
        }
        
        // Create spell context
        SpellContext context = new SpellContext(
            caster,
            spellLevel,
            caster.getLocation(),
            caster.getLocation().getDirection(),
            caster.getEquipment().getItemInMainHand()
        );
        
        // Cast the spell
        try {
            spell.onCast(context);
            return SpellResult.success();
        } catch (Exception e) {
            plugin.getLogger().severe("Error casting spell: " + spellId);
            e.printStackTrace();
            return SpellResult.failure("Error casting spell");
        }
    }
}
```

---

### 2.3 School System

#### SchoolType

```java
package com.irons.spellbooks.school;

import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.LivingEntity;
import org.bukkit.inventory.ItemStack;

public class SchoolType {
    
    private final String id;
    private final String displayName;
    private final ChatColor color;
    private final Sound castSound;
    private final Particle particle;
    private final String damageType;
    
    public SchoolType(String id, String displayName, ChatColor color, Sound castSound, Particle particle, String damageType) {
        this.id = id;
        this.displayName = displayName;
        this.color = color;
        this.castSound = castSound;
        this.particle = particle;
        this.damageType = damageType;
    }
    
    // Getters
    public String getId() { return id; }
    public String getDisplayName() { return displayName; }
    public ChatColor getColor() { return color; }
    public Sound getCastSound() { return castSound; }
    public Particle getParticle() { return particle; }
    public String getDamageType() { return damageType; }
    
    // School-specific mechanics
    public double getResistance(LivingEntity entity) {
        // Calculate resistance based on attributes
        return 1.0; // Default
    }
    
    public double getPower(LivingEntity entity) {
        // Calculate power based on attributes
        return 1.0; // Default
    }
    
    public boolean isFocusItem(ItemStack item) {
        // Check if item is a focus for this school
        return false; // To be implemented
    }
}
```

#### SchoolRegistry

```java
package com.irons.spellbooks.school;

import com.irons.spellbooks.IronSpellsPaper;
import org.bukkit.ChatColor;
import org.bukkit.Particle;
import org.bukkit.Sound;

import java.util.HashMap;
import java.util.Map;

public class SchoolRegistry {
    
    private final IronSpellsPaper plugin;
    private final Map<String, SchoolType> schools = new HashMap<>();
    
    public SchoolRegistry(IronSpellsPaper plugin) {
        this.plugin = plugin;
        registerDefaultSchools();
    }
    
    private void registerDefaultSchools() {
        // Register spell schools
        registerSchool(new SchoolType(
            "fire",
            "Fire",
            ChatColor.GOLD,
            Sound.ENTITY_BLAZE_AMBIENT,
            Particle.FLAME,
            "fire_magic"
        ));
        
        registerSchool(new SchoolType(
            "ice",
            "Ice",
            ChatColor.AQUA,
            Sound.BLOCK_GLASS_BREAK,
            Particle.SNOWFLAKE,
            "ice_magic"
        ));
        
        registerSchool(new SchoolType(
            "lightning",
            "Lightning",
            ChatColor.YELLOW,
            Sound.ENTITY_LIGHTNING_BOLT_THUNDER,
            Particle.ELECTRIC_SPARK,
            "lightning_magic"
        ));
        
        registerSchool(new SchoolType(
            "holy",
            "Holy",
            ChatColor.WHITE,
            Sound.ENTITY_EXPERIENCE_ORB_PICKUP,
            Particle.TOTEM_OF_UNDYING,
            "holy_magic"
        ));
        
        registerSchool(new SchoolType(
            "ender",
            "Ender",
            ChatColor.LIGHT_PURPLE,
            Sound.ENTITY_ENDERMAN_TELEPORT,
            Particle.PORTAL,
            "ender_magic"
        ));
        
        registerSchool(new SchoolType(
            "blood",
            "Blood",
            ChatColor.DARK_RED,
            Sound.ENTITY_GENERIC_DRINK,
            Particle.DRIPPING_LAVA,
            "blood_magic"
        ));
        
        registerSchool(new SchoolType(
            "evocation",
            "Evocation",
            ChatColor.GRAY,
            Sound.ENTITY_EVOKER_PREPARE_ATTACK,
            Particle.SPELL_WITCH,
            "evocation_magic"
        ));
        
        registerSchool(new SchoolType(
            "nature",
            "Nature",
            ChatColor.GREEN,
            Sound.BLOCK_GRASS_BREAK,
            Particle.VINE,
            "nature_magic"
        ));
        
        registerSchool(new SchoolType(
            "eldritch",
            "Eldritch",
            ChatColor.DARK_PURPLE,
            Sound.ENTITY_ELDER_GUARDIAN_CURSE,
            Particle.SQUID_INK,
            "eldritch_magic"
        ));
    }
    
    public void registerSchool(SchoolType school) {
        schools.put(school.getId(), school);
    }
    
    public SchoolType getSchool(String id) {
        return schools.get(id);
    }
    
    public Map<String, SchoolType> getAllSchools() {
        return new HashMap<>(schools);
    }
}
```

---

### 2.4 Item System

#### CustomItem (Base Class)

```java
package com.irons.spellbooks.item;

import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

public class CustomItem {
    
    private final String id;
    private final Material material;
    private final String displayName;
    private final String[] lore;
    
    public CustomItem(String id, Material material, String displayName, String[] lore) {
        this.id = id;
        this.material = material;
        this.displayName = displayName;
        this.lore = lore;
    }
    
    public ItemStack createItemStack() {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        
        if (meta != null) {
            meta.setDisplayName(displayName);
            if (lore != null && lore.length > 0) {
                meta.setLore(java.util.Arrays.asList(lore));
            }
            
            // Store custom item ID in persistent data
            PersistentDataContainer container = meta.getPersistentDataContainer();
            NamespacedKey key = new NamespacedKey("irons_spellbooks", "custom_item");
            container.set(key, PersistentDataType.STRING, id);
            
            item.setItemMeta(meta);
        }
        
        return item;
    }
    
    public static boolean isCustomItem(ItemStack item, String itemId) {
        if (item == null || !item.hasItemMeta()) {
            return false;
        }
        
        ItemMeta meta = item.getItemMeta();
        PersistentDataContainer container = meta.getPersistentDataContainer();
        NamespacedKey key = new NamespacedKey("irons_spellbooks", "custom_item");
        
        String storedId = container.get(key, PersistentDataType.STRING);
        return itemId.equals(storedId);
    }
    
    public static String getCustomItemId(ItemStack item) {
        if (item == null || !item.hasItemMeta()) {
            return null;
        }
        
        ItemMeta meta = item.getItemMeta();
        PersistentDataContainer container = meta.getPersistentDataContainer();
        NamespacedKey key = new NamespacedKey("irons_spellbooks", "custom_item");
        
        return container.get(key, PersistentDataType.STRING);
    }
}
```

#### SpellBook

```java
package com.irons.spellbooks.item;

import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import java.util.ArrayList;
import java.util.List;

public class SpellBook extends CustomItem {
    
    private final int maxSpellSlots;
    private final double maxManaBonus;
    private final double cooldownReduction;
    
    public SpellBook(String id, Material material, String displayName, int maxSpellSlots, 
                     double maxManaBonus, double cooldownReduction) {
        super(id, material, displayName, null);
        this.maxSpellSlots = maxSpellSlots;
        this.maxManaBonus = maxManaBonus;
        this.cooldownReduction = cooldownReduction;
    }
    
    @Override
    public ItemStack createItemStack() {
        ItemStack item = super.createItemStack();
        ItemMeta meta = item.getItemMeta();
        
        if (meta != null) {
            // Store spell book data
            PersistentDataContainer container = meta.getPersistentDataContainer();
            NamespacedKey key = new NamespacedKey("irons_spellbooks", "spell_book");
            
            container.set(new NamespacedKey("irons_spellbooks", "max_slots"), PersistentDataType.INTEGER, maxSpellSlots);
            container.set(new NamespacedKey("irons_spellbooks", "max_mana"), PersistentDataType.DOUBLE, maxManaBonus);
            container.set(new NamespacedKey("irons_spellbooks", "cooldown_reduction"), PersistentDataType.DOUBLE, cooldownReduction);
            
            // Initialize empty spell list
            container.set(new NamespacedKey("irons_spellbooks", "spells"), PersistentDataType.STRING, "");
            
            item.setItemMeta(meta);
        }
        
        return item;
    }
    
    public static List<String> getSpells(ItemStack spellBook) {
        List<String> spells = new ArrayList<>();
        
        if (spellBook == null || !spellBook.hasItemMeta()) {
            return spells;
        }
        
        ItemMeta meta = spellBook.getItemMeta();
        PersistentDataContainer container = meta.getPersistentDataContainer();
        NamespacedKey key = new NamespacedKey("irons_spellbooks", "spells");
        
        String spellsData = container.get(key, PersistentDataType.STRING);
        if (spellsData != null && !spellsData.isEmpty()) {
            String[] spellArray = spellsData.split(",");
            for (String spell : spellArray) {
                if (!spell.isEmpty()) {
                    spells.add(spell);
                }
            }
        }
        
        return spells;
    }
    
    public static boolean addSpell(ItemStack spellBook, String spellId) {
        List<String> spells = getSpells(spellBook);
        
        if (spells.contains(spellId)) {
            return false; // Already has spell
        }
        
        int maxSlots = getMaxSpellSlots(spellBook);
        if (spells.size() >= maxSlots) {
            return false; // Full
        }
        
        spells.add(spellId);
        setSpells(spellBook, spells);
        return true;
    }
    
    public static boolean removeSpell(ItemStack spellBook, String spellId) {
        List<String> spells = getSpells(spellBook);
        
        if (!spells.remove(spellId)) {
            return false; // Spell not found
        }
        
        setSpells(spellBook, spells);
        return true;
    }
    
    private static void setSpells(ItemStack spellBook, List<String> spells) {
        ItemMeta meta = spellBook.getItemMeta();
        if (meta != null) {
            PersistentDataContainer container = meta.getPersistentDataContainer();
            NamespacedKey key = new NamespacedKey("irons_spellbooks", "spells");
            
            String spellsData = String.join(",", spells);
            container.set(key, PersistentDataType.STRING, spellsData);
            
            spellBook.setItemMeta(meta);
        }
    }
    
    public static int getMaxSpellSlots(ItemStack spellBook) {
        if (spellBook == null || !spellBook.hasItemMeta()) {
            return 0;
        }
        
        ItemMeta meta = spellBook.getItemMeta();
        PersistentDataContainer container = meta.getPersistentDataContainer();
        NamespacedKey key = new NamespacedKey("irons_spellbooks", "max_slots");
        
        Integer slots = container.get(key, PersistentDataType.INTEGER);
        return slots != null ? slots : 0;
    }
}
```

---

### 2.5 Player Data System

#### PlayerData

```java
package com.irons.spellbooks.player;

import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;

import java.util.HashMap;
import java.util.Map;

public class PlayerData {
    
    private final Player player;
    private final Map<String, Integer> knownSpells; // spellId -> level
    private final Map<String, Long> cooldowns; // spellId -> expiry time
    private int mana;
    private int maxMana;
    private String selectedSpell;
    
    public PlayerData(Player player) {
        this.player = player;
        this.knownSpells = new HashMap<>();
        this.cooldowns = new HashMap<>();
        this.mana = 100;
        this.maxMana = 100;
        this.selectedSpell = null;
    }
    
    // Getters
    public Player getPlayer() { return player; }
    public int getMana() { return mana; }
    public int getMaxMana() { return maxMana; }
    public String getSelectedSpell() { return selectedSpell; }
    
    // Setters
    public void setMana(int mana) { 
        this.mana = Math.min(mana, maxMana); 
    }
    
    public void setMaxMana(int maxMana) { 
        this.maxMana = maxMana;
        if (mana > maxMana) {
            mana = maxMana;
        }
    }
    
    public void setSelectedSpell(String spellId) { 
        this.selectedSpell = spellId; 
    }
    
    // Spell management
    public boolean hasSpell(String spellId) {
        return knownSpells.containsKey(spellId);
    }
    
    public int getSpellLevel(String spellId) {
        return knownSpells.getOrDefault(spellId, 0);
    }
    
    public void learnSpell(String spellId, int level) {
        knownSpells.put(spellId, level);
    }
    
    public void forgetSpell(String spellId) {
        knownSpells.remove(spellId);
    }
    
    public Map<String, Integer> getKnownSpells() {
        return new HashMap<>(knownSpells);
    }
    
    // Cooldown management
    public boolean isOnCooldown(String spellId) {
        Long expiry = cooldowns.get(spellId);
        if (expiry == null) {
            return false;
        }
        
        if (System.currentTimeMillis() > expiry) {
            cooldowns.remove(spellId);
            return false;
        }
        
        return true;
    }
    
    public long getRemainingCooldown(String spellId) {
        Long expiry = cooldowns.get(spellId);
        if (expiry == null) {
            return 0;
        }
        
        long remaining = expiry - System.currentTimeMillis();
        return Math.max(0, remaining);
    }
    
    public void setCooldown(String spellId, int seconds) {
        long expiry = System.currentTimeMillis() + (seconds * 1000L);
        cooldowns.put(spellId, expiry);
    }
    
    public void clearCooldown(String spellId) {
        cooldowns.remove(spellId);
    }
    
    public void clearAllCooldowns() {
        cooldowns.clear();
    }
    
    // Serialization
    public void save(ConfigurationSection section) {
        section.set("mana", mana);
        section.set("max_mana", maxMana);
        section.set("selected_spell", selectedSpell);
        
        // Save known spells
        ConfigurationSection spellsSection = section.createSection("known_spells");
        for (Map.Entry<String, Integer> entry : knownSpells.entrySet()) {
            spellsSection.set(entry.getKey(), entry.getValue());
        }
        
        // Save cooldowns (relative time in seconds)
        ConfigurationSection cooldownsSection = section.createSection("cooldowns");
        long currentTime = System.currentTimeMillis();
        for (Map.Entry<String, Long> entry : cooldowns.entrySet()) {
            long remaining = (entry.getValue() - currentTime) / 1000;
            if (remaining > 0) {
                cooldownsSection.set(entry.getKey(), remaining);
            }
        }
    }
    
    public void load(ConfigurationSection section) {
        mana = section.getInt("mana", 100);
        maxMana = section.getInt("max_mana", 100);
        selectedSpell = section.getString("selected_spell");
        
        // Load known spells
        ConfigurationSection spellsSection = section.getConfigurationSection("known_spells");
        if (spellsSection != null) {
            for (String spellId : spellsSection.getKeys(false)) {
                int level = spellsSection.getInt(spellId);
                knownSpells.put(spellId, level);
            }
        }
        
        // Load cooldowns
        ConfigurationSection cooldownsSection = section.getConfigurationSection("cooldowns");
        if (cooldownsSection != null) {
            long currentTime = System.currentTimeMillis();
            for (String spellId : cooldownsSection.getKeys(false)) {
                int remaining = cooldownsSection.getInt(spellId);
                long expiry = currentTime + (remaining * 1000L);
                cooldowns.put(spellId, expiry);
            }
        }
    }
}
```

#### PlayerDataManager

```java
package com.irons.spellbooks.player;

import com.irons.spellbooks.IronSpellsPaper;
import org.bukkit.Bukkit;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class PlayerDataManager {
    
    private final IronSpellsPaper plugin;
    private final Map<UUID, PlayerData> playerDataMap = new HashMap<>();
    private final File dataFolder;
    
    public PlayerDataManager(IronSpellsPaper plugin) {
        this.plugin = plugin;
        this.dataFolder = new File(plugin.getDataFolder(), "playerdata");
        if (!dataFolder.exists()) {
            dataFolder.mkdirs();
        }
        
        // Load online players
        for (Player player : Bukkit.getOnlinePlayers()) {
            loadPlayerData(player);
        }
    }
    
    public PlayerData getPlayerData(Player player) {
        return playerDataMap.computeIfAbsent(player.getUniqueId(), uuid -> {
            PlayerData data = new PlayerData(player);
            loadPlayerData(player);
            return data;
        });
    }
    
    public void loadPlayerData(Player player) {
        File playerFile = new File(dataFolder, player.getUniqueId() + ".yml");
        if (playerFile.exists()) {
            YamlConfiguration config = YamlConfiguration.loadConfiguration(playerFile);
            PlayerData data = new PlayerData(player);
            data.load(config);
            playerDataMap.put(player.getUniqueId(), data);
        } else {
            playerDataMap.put(player.getUniqueId(), new PlayerData(player));
        }
    }
    
    public void savePlayerData(Player player) {
        PlayerData data = playerDataMap.get(player.getUniqueId());
        if (data == null) {
            return;
        }
        
        File playerFile = new File(dataFolder, player.getUniqueId() + ".yml");
        YamlConfiguration config = new YamlConfiguration();
        
        data.save(config);
        
        try {
            config.save(playerFile);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to save player data for " + player.getName());
            e.printStackTrace();
        }
    }
    
    public void removePlayerData(Player player) {
        savePlayerData(player);
        playerDataMap.remove(player.getUniqueId());
    }
    
    public void saveAll() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            savePlayerData(player);
        }
    }
}
```

---

### 2.6 Configuration System

#### ConfigManager

```java
package com.irons.spellbooks.config;

import com.irons.spellbooks.IronSpellsPaper;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;

public class ConfigManager {
    
    private final IronSpellsPaper plugin;
    private FileConfiguration config;
    private FileConfiguration spellConfig;
    
    public ConfigManager(IronSpellsPaper plugin) {
        this.plugin = plugin;
        loadConfigs();
    }
    
    private void loadConfigs() {
        // Load main config
        plugin.saveDefaultConfig();
        config = plugin.getConfig();
        
        // Load spell config
        File spellConfigFile = new File(plugin.getDataFolder(), "spells.yml");
        if (!spellConfigFile.exists()) {
            plugin.saveResource("spells.yml", false);
        }
        spellConfig = YamlConfiguration.loadConfiguration(spellConfigFile);
    }
    
    public void reloadConfigs() {
        plugin.reloadConfig();
        config = plugin.getConfig();
        
        File spellConfigFile = new File(plugin.getDataFolder(), "spells.yml");
        spellConfig = YamlConfiguration.loadConfiguration(spellConfigFile);
    }
    
    public FileConfiguration getConfig() {
        return config;
    }
    
    public FileConfiguration getSpellConfig() {
        return spellConfig;
    }
    
    // Convenience methods for common config values
    public int getDefaultMaxMana() {
        return config.getInt("default_max_mana", 100);
    }
    
    public int getManaRegenRate() {
        return config.getInt("mana_regen_rate", 1);
    }
    
    public boolean isSpellEnabled(String spellId) {
        return spellConfig.getBoolean("spells." + spellId + ".enabled", true);
    }
    
    public double getSpellDamageMultiplier(String spellId) {
        return spellConfig.getDouble("spells." + spellId + ".damage_multiplier", 1.0);
    }
    
    public double getSpellManaCostMultiplier(String spellId) {
        return spellConfig.getDouble("spells." + spellId + ".mana_cost_multiplier", 1.0);
    }
    
    public double getSpellCooldownMultiplier(String spellId) {
        return spellConfig.getDouble("spells." + spellId + ".cooldown_multiplier", 1.0);
    }
}
```

---

## 3. Event System

### SpellCastEvent

```java
package com.irons.spellbooks.api.event;

import org.bukkit.entity.LivingEntity;
import org.bukkit.event.Cancellable;
import org.bukkit.event.Event;
import org.bukkit.event.HandlerList;

public class SpellCastEvent extends Event implements Cancellable {
    
    private static final HandlerList handlers = new HandlerList();
    
    private final LivingEntity caster;
    private final String spellId;
    private final int spellLevel;
    private boolean cancelled;
    
    public SpellCastEvent(LivingEntity caster, String spellId, int spellLevel) {
        this.caster = caster;
        this.spellId = spellId;
        this.spellLevel = spellLevel;
        this.cancelled = false;
    }
    
    public LivingEntity getCaster() { return caster; }
    public String getSpellId() { return spellId; }
    public int getSpellLevel() { return spellLevel; }
    
    @Override
    public boolean isCancelled() { return cancelled; }
    
    @Override
    public void setCancelled(boolean cancelled) { this.cancelled = cancelled; }
    
    @Override
    public HandlerList getHandlers() { return handlers; }
    
    public static HandlerList getHandlerList() { return handlers; }
}
```

---

## 4. Build Configuration

### build.gradle.kts

```kotlin
plugins {
    java
    `maven-publish`
}

group = "com.irons.spellbooks"
version = "1.0.0"

repositories {
    mavenCentral()
    maven("https://repo.papermc.io/repository/maven-public/")
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.8-R0.1-SNAPSHOT")
    // Add other dependencies as needed
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}
```

### plugin.yml

```yaml
name: IronSpellsPaper
version: 1.0.0
main: com.irons.spellbooks.IronSpellsPaper
api-version: 1.21
author: Iron431 (ported by Devin)
description: A magic plugin for Paper servers - port of Iron's Spells 'n Spellbooks
website: https://github.com/iron431/Irons-Spells-n-Spellbooks

commands:
  cast:
    description: Cast a spell
    usage: /cast <spell> [level]
    permission: ironspells.cast
  learn:
    description: Learn a spell
    usage: /learn <spell> [level]
    permission: ironspells.learn
  mana:
    description: Manage mana
    usage: /mana <set|add|reset> [amount]
    permission: ironspells.mana
  spellbook:
    description: Spellbook commands
    usage: /spellbook <open|upgrade|info>
    permission: ironspells.spellbook
  ironspells:
    description: Admin commands
    usage: /ironspells <reload|debug>
    permission: ironspells.admin

permissions:
  ironspells.*:
    description: All permissions
    children:
      ironspells.cast: true
      ironspells.learn: true
      ironspells.mana: true
      ironspells.spellbook: true
      ironspells.admin: true
  ironspells.cast:
    description: Allow casting spells
    default: true
  ironspells.learn:
    description: Allow learning spells
    default: true
  ironspells.mana:
    description: Allow mana management
    default: true
  ironspells.spellbook:
    description: Allow spellbook commands
    default: true
  ironspells.admin:
    description: Admin commands
    default: op
```

---

## 5. Implementation Priorities

### Phase 1: Core Infrastructure (MVP)
1. Main plugin class
2. Configuration system
3. Player data persistence
4. Basic command framework
5. School registry
6. Spell registry (empty)

### Phase 2: Basic Spell System
1. AbstractSpell base class
2. SpellContext and SpellResult
3. SpellCaster
4. 5-10 basic spells (Fireball, Heal, etc.)
5. Mana management
6. Cooldown management

### Phase 3: Items
1. CustomItem base class
2. SpellBook implementation
3. Basic spell book GUI
4. 3-5 spell book types

### Phase 4: Expansion
1. Remaining spell schools
2. More spells
3. More items
4. Custom effects
5. Basic entities

### Phase 5: Polish
1. All 114 spells
2. All items
3. Advanced features
4. Resource pack
5. Performance optimization

---

## 6. Testing Strategy

### Unit Testing
- Test spell logic in isolation
- Test mana calculations
- Test cooldown logic
- Test data serialization

### Integration Testing
- Test spell casting in-game
- Test item interactions
- Test player data persistence
- Test multiplayer scenarios

### Performance Testing
- Test with multiple players
- Test spell spam
- Test entity spawning
- Monitor server resources

---

## 7. Known Limitations

1. **No Client-Side UI** - Must use inventory-based GUIs
2. **No Custom Animations** - Use vanilla animations
3. **Limited Particles** - Use vanilla particles
4. **No Curios** - Custom accessory system needed
5. **No GeckoLib** - Entity animations simplified
6. **No Client Packets** - Cannot send to vanilla clients

---

## 8. Future Enhancements

1. **Resource Pack** - Custom textures, sounds, GUI
2. **Holographic Displays** - For spell information
3. **WorldGuard Integration** - Spell casting in regions
4. **Vault Integration** - Economy integration
5. **PlaceholderAPI** - Placeholder support
6. **Database Storage** - Alternative to YAML
7. **Metrics** - Usage statistics

---

This architecture provides a solid foundation for porting Iron's Spells 'n Spellbooks to Paper while acknowledging the platform limitations and focusing on core gameplay mechanics.
