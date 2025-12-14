
import re
import sys
from pathlib import Path

def fix_app_js(content):
    """Sửa lỗi trong app.js"""
    print("🔧 Đang sửa app.js...")
    
    # Fix 1: Thêm vào switchTab()
    pattern = r"(if \(tabId === 'attendanceTab'\) \{\s+loadAttendanceTab\(\);\s+\} else if \(tabId === 'commentsTab'\) \{\s+loadCommentsTab\(\);)\s+\}"
    replacement = r"\1 } else if (tabId === 'assignmentsTab') {\n        loadAssignmentsTab();\n    } else if (tabId === 'gradesTab') {\n        loadGradesTab();\n    }\n}"
    
    content = re.sub(pattern, replacement, content)
    
    # Fix 2: Thêm loadAssignmentsTab và loadGradesTab trước window.login
    insert_pos = content.find('// ===== EXPOSE TO WINDOW =====\nwindow.login = login;')
    
    if insert_pos == -1:
        insert_pos = content.find('window.login = login;')
    
    if insert_pos > 0:
        new_functions = '''
// ===== ASSIGNMENTS & GRADES TABS =====
async function loadAssignmentsTab() {
    if (!currentClassId) return;
    window.currentClassForAssignment = currentClassId;
    
    const addBtn = document.getElementById('addAssignmentBtn');
    if (addBtn) {
        const canCreate = hasPermission('', 'classes', 'create');
        addBtn.style.display = canCreate ? 'inline-block' : 'none';
    }
    
    if (typeof window.loadAssignments === 'function') {
        await window.loadAssignments(currentClassId);
    }
}

async function loadGradesTab() {
    if (!currentClassId) return;
    if (typeof window.loadGrades === 'function') {
        await window.loadGrades(currentClassId);
    }
}

'''
        content = content[:insert_pos] + new_functions + content[insert_pos:]
    
    # Fix 3: Export functions
    pattern = r"(window\.exportCMs = exportCMs;)"
    replacement = r"\1\nwindow.loadAssignmentsTab = loadAssignmentsTab;\nwindow.loadGradesTab = loadGradesTab;"
    content = re.sub(pattern, replacement, content)
    
    # Fix 4: Update console.log
    content = content.replace(
        "console.log('✅ App.js v2.1 loaded successfully - All bugs fixed!');",
        "console.log('✅ App.js v2.2 loaded successfully - Assignments & Grades Fixed!');"
    )
    
    print("✅ app.js đã sửa xong!")
    return content


def fix_app_assignments_js(content):
    """Sửa lỗi trong app-assignments.js"""
    print("🔧 Đang sửa app-assignments.js...")
    
    # Fix: Thêm helpers từ window ở đầu file (sau global state)
    pattern = r"(let currentAssignmentId = null;\s+let currentClassForAssignment = null;)"
    
    helpers = r'''\1

// ===== HELPERS FROM APP.JS =====
const formatDate = window.formatDate || function(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
};

const formatDateTime = window.formatDateTime || function(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const showAlert = window.showAlert || function(type, msg) {
    console.log(`${type.toUpperCase()}: ${msg}`);
};

const showLoading = window.showLoading || function() {};
const hideLoading = window.hideLoading || function() {};
const openModal = window.openModal || function(id) {};
const closeModal = window.closeModal || function(id) {};
const hasPermission = window.hasPermission || function() { return true; };
const currentUser = window.currentUser || { roleId: 0, id: 1 };
const XLSX = window.XLSX;
'''
    
    content = re.sub(pattern, helpers, content)
    
    # Update console.log
    content = content.replace(
        "console.log('✅ Assignments module loaded');",
        "console.log('✅ Assignments module loaded - FIXED VERSION');"
    )
    
    print("✅ app-assignments.js đã sửa xong!")
    return content


def main():
    print("=" * 60)
    print("🚀 AUTO-FIX SCRIPT - ClassFlow Frontend")
    print("=" * 60)
    print()
    
    # Check files
    app_js = Path('app.js')
    app_assignments_js = Path('app-assignments.js')
    
    if not app_js.exists():
        print("❌ Không tìm thấy file app.js")
        print("💡 Hãy chạy script trong thư mục chứa file app.js")
        return 1
    
    if not app_assignments_js.exists():
        print("⚠️  Không tìm thấy file app-assignments.js")
        print("💡 Sẽ chỉ sửa app.js")
    
    # Backup
    print("📦 Đang backup files...")
    app_js.rename('app.js.backup')
    if app_assignments_js.exists():
        app_assignments_js.rename('app-assignments.js.backup')
    print("✅ Đã backup: app.js.backup")
    
    # Fix app.js
    print()
    with open('app.js.backup', 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed_content = fix_app_js(content)
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"📝 Đã tạo: app.js ({len(fixed_content)} bytes)")
    
    # Fix app-assignments.js
    if app_assignments_js.with_suffix('.js.backup').exists():
        print()
        with open('app-assignments.js.backup', 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = fix_app_assignments_js(content)
        
        with open('app-assignments.js', 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"📝 Đã tạo: app-assignments.js ({len(fixed_content)} bytes)")
    
    print()
    print("=" * 60)
    print("✅ HOÀN THÀNH!")
    print("=" * 60)
    print()
    print("📋 Các file đã sửa:")
    print("   • app.js")
    if app_assignments_js.with_suffix('.js.backup').exists():
        print("   • app-assignments.js")
    print()
    print("📦 Backup files:")
    print("   • app.js.backup")
    if app_assignments_js.with_suffix('.js.backup').exists():
        print("   • app-assignments.js.backup")
    print()
    print("🧪 KIỂM TRA:")
    print("   1. Hard refresh browser (Ctrl+Shift+R)")
    print("   2. Mở Console (F12) và chạy:")
    print("      console.log(typeof window.loadAssignmentsTab);")
    print("   3. Mở chi tiết lớp → Click tab 'Bài tập'")
    print()
    print("🔄 Nếu muốn khôi phục:")
    print("   mv app.js.backup app.js")
    if app_assignments_js.with_suffix('.js.backup').exists():
        print("   mv app-assignments.js.backup app-assignments.js")
    print()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())